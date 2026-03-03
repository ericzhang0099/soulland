import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import alipayService from '../services/alipay.service';
import blockchainService from '../services/blockchain.service';
import {
  OrderModel,
  OrderStatus,
  PaymentModel,
  PaymentType,
  PaymentStatus,
  AGCBalanceModel,
  AGCTransactionType,
  AlipayNotificationModel,
} from '../models';

const router = Router();

/**
 * 验证请求结果
 */
const handleValidationErrors = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: '参数验证失败',
      details: errors.array(),
    });
  }
  next();
};

/**
 * POST /api/payment/alipay/create
 * 创建支付宝支付订单
 */
router.post(
  '/alipay/create',
  [
    body('userAddress').isEthereumAddress().withMessage('无效的钱包地址'),
    body('amount').isFloat({ min: 0.01, max: 100000 }).withMessage('金额必须在0.01-100000之间'),
    body('subject').optional().isString().isLength({ max: 256 }),
    body('body').optional().isString().isLength({ max: 128 }),
    body('deviceType').optional().isIn(['pc', 'mobile', 'app']),
    body('returnUrl').optional().isURL(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const {
        userAddress,
        amount,
        subject,
        body: orderBody,
        deviceType = 'pc',
        returnUrl,
        metadata,
      } = req.body;

      // 检查支付宝服务是否可用
      if (!alipayService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: '支付服务暂时不可用',
        });
      }

      // 生成订单ID
      const orderId = alipayService.generateOrderId();

      // 计算积分数量（如果区块链服务可用）
      let pointsAmount = 0;
      try {
        if (blockchainService.isAvailable()) {
          const pointsStr = await blockchainService.calculatePoints(parseFloat(amount));
          pointsAmount = parseFloat(pointsStr) / 1e18; // 转换为可读格式
        } else {
          // 默认汇率：1元 = 10 AGC
          pointsAmount = parseFloat(amount) * 10;
        }
      } catch (error) {
        console.warn('计算积分失败，使用默认汇率:', error);
        pointsAmount = parseFloat(amount) * 10;
      }

      // 在数据库中创建订单
      await OrderModel.create({
        id: orderId,
        user_address: userAddress.toLowerCase(),
        amount_cny: parseFloat(amount),
        points_amount: pointsAmount,
        metadata: {
          subject: subject || 'GenLoop积分充值',
          body: orderBody || '购买GenLoop积分',
          device_type: deviceType,
          ...metadata,
        },
      });

      // 如果区块链服务可用，在链上创建订单
      let chainOrderId = '';
      let transactionHash = '';
      if (blockchainService.isAvailable()) {
        try {
          const chainResult = await blockchainService.createOrderOnChain(
            userAddress,
            parseFloat(amount),
            JSON.stringify({ orderId, subject })
          );
          if (chainResult) {
            chainOrderId = chainResult.orderId;
            transactionHash = chainResult.transactionHash;
          }
        } catch (error) {
          console.error('链上创建订单失败:', error);
          // 链上创建失败不影响线下订单创建
        }
      }

      // 创建支付宝支付
      const paymentParams = {
        outTradeNo: orderId,
        totalAmount: parseFloat(amount),
        subject: subject || 'GenLoop积分充值',
        body: orderBody || '购买GenLoop积分',
        returnUrl: returnUrl || `${process.env.FRONTEND_URL}/payment/callback`,
        notifyUrl: `${process.env.API_URL}/api/payment/alipay/callback`,
      };

      let paymentUrl: string;
      if (deviceType === 'mobile') {
        paymentUrl = await alipayService.createWapPay(paymentParams);
      } else if (deviceType === 'app') {
        paymentUrl = await alipayService.createAppPay(paymentParams);
      } else {
        paymentUrl = await alipayService.createPagePay(paymentParams);
      }

      // 创建支付记录
      await PaymentModel.create({
        order_id: orderId,
        payment_type: PaymentType.ALIPAY,
        amount: parseFloat(amount),
        currency: 'CNY',
      });

      res.json({
        success: true,
        data: {
          orderId,
          chainOrderId,
          transactionHash,
          paymentUrl,
          amount: parseFloat(amount),
          pointsAmount,
          expiresIn: 1800, // 30分钟有效期
        },
      });
    } catch (error: any) {
      console.error('创建支付订单失败:', error);
      res.status(500).json({
        success: false,
        error: '创建支付订单失败',
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/payment/alipay/callback
 * 支付宝异步通知回调
 */
router.post('/alipay/callback', async (req: Request, res: Response) => {
  try {
    const notifyData = req.body;
    console.log('收到支付宝异步通知:', JSON.stringify(notifyData, null, 2));

    // 解析通知数据
    const parsedData = alipayService.parseNotify(notifyData);

    // 检查通知是否已处理
    const notifyExists = await AlipayNotificationModel.exists(parsedData.notifyId);
    if (notifyExists) {
      console.log('通知已存在，跳过处理:', parsedData.notifyId);
      return res.send('success');
    }

    // 验证签名
    const isValid = alipayService.verifyNotify(notifyData);

    // 记录通知日志
    await AlipayNotificationModel.create({
      notify_id: parsedData.notifyId,
      notify_type: parsedData.notifyType,
      out_trade_no: parsedData.outTradeNo,
      trade_no: parsedData.tradeNo,
      trade_status: parsedData.tradeStatus,
      total_amount: parsedData.totalAmount,
      buyer_id: parsedData.buyerId,
      buyer_logon_id: parsedData.buyerLogonId,
      notify_data: notifyData,
      verified: isValid,
    });

    if (!isValid) {
      console.warn('支付宝通知签名验证失败');
      return res.send('fail');
    }

    const { outTradeNo, tradeNo, tradeStatus } = parsedData;

    // 查找订单
    const order = await OrderModel.findById(outTradeNo);
    if (!order) {
      console.warn('订单不存在:', outTradeNo);
      return res.send('success'); // 返回success避免支付宝重试
    }

    // 处理支付结果
    if (alipayService.isTradeSuccess(tradeStatus)) {
      // 检查订单是否已处理
      if (order.status !== OrderStatus.PENDING) {
        console.log('订单已处理，跳过:', outTradeNo);
        return res.send('success');
      }

      // 更新订单状态为已支付
      await OrderModel.markAsPaid(outTradeNo, tradeNo);

      // 更新支付记录
      const payments = await PaymentModel.findByOrderId(outTradeNo);
      if (payments.length > 0) {
        await PaymentModel.markAsSuccess(payments[0].id, {
          notify_data: notifyData,
        });
      }

      // 调用智能合约确认支付并发放积分
      if (blockchainService.isAvailable()) {
        try {
          const result = await blockchainService.confirmPayment(outTradeNo, tradeNo);
          if (result) {
            // 更新订单状态为已完成
            await OrderModel.markAsCompleted(outTradeNo);

            // 更新支付记录的交易哈希
            if (payments.length > 0) {
              await PaymentModel.update(payments[0].id, {
                transaction_hash: result.transactionHash,
              });
            }

            // 更新用户AGC余额
            await AGCBalanceModel.addBalance(
              order.user_address,
              order.points_amount,
              AGCTransactionType.PURCHASE,
              {
                order_id: outTradeNo,
                transaction_hash: result.transactionHash,
                description: '支付宝购买积分',
              }
            );

            console.log(`支付成功并发放积分: ${outTradeNo}, 交易哈希: ${result.transactionHash}`);
          }
        } catch (error) {
          console.error('链上确认支付失败:', error);
          // 链上失败不影响支付宝通知响应，后续可以通过定时任务重试
        }
      } else {
        // 如果没有区块链服务，直接更新为已完成
        await OrderModel.markAsCompleted(outTradeNo);
        await AGCBalanceModel.addBalance(
          order.user_address,
          order.points_amount,
          AGCTransactionType.PURCHASE,
          {
            order_id: outTradeNo,
            description: '支付宝购买积分（链下）',
          }
        );
      }
    } else if (alipayService.isTradeClosed(tradeStatus)) {
      // 订单关闭
      await OrderModel.markAsCancelled(outTradeNo);
      console.log(`订单已关闭: ${outTradeNo}`);
    }

    // 标记通知为已处理
    const notification = await AlipayNotificationModel.findByNotifyId(parsedData.notifyId);
    if (notification) {
      await AlipayNotificationModel.markAsProcessed(notification.id);
    }

    // 必须返回 success
    res.send('success');
  } catch (error: any) {
    console.error('处理支付宝通知失败:', error);
    res.send('fail');
  }
});

/**
 * GET /api/payment/alipay/return
 * 支付宝同步回调（支付完成跳转）
 */
router.get('/alipay/return', async (req: Request, res: Response) => {
  try {
    const params = req.query as Record<string, any>;

    // 验证签名
    const isValid = alipayService.verifyReturn(params);

    if (!isValid) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/error?reason=invalid_sign`);
    }

    const { out_trade_no, trade_no, trade_status } = params;

    // 重定向到前端结果页面
    if (alipayService.isTradeSuccess(trade_status)) {
      res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${out_trade_no}`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/payment/pending?orderId=${out_trade_no}`);
    }
  } catch (error) {
    console.error('处理同步回调失败:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
  }
});

/**
 * GET /api/payment/order/:id
 * 查询订单详情
 */
router.get(
  '/order/:id',
  [param('id').isString().notEmpty(), handleValidationErrors],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // 查询数据库订单
      const order = await OrderModel.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: '订单不存在',
        });
      }

      // 查询支付记录
      const payments = await PaymentModel.findByOrderId(id);

      // 如果订单待支付，向支付宝查询最新状态
      let alipayStatus = null;
      if (order.status === OrderStatus.PENDING && alipayService.isAvailable()) {
        try {
          alipayStatus = await alipayService.queryOrder({ outTradeNo: id });
        } catch (error) {
          console.warn('查询支付宝订单状态失败:', error);
        }
      }

      // 查询链上订单信息
      let chainOrder = null;
      if (blockchainService.isAvailable()) {
        try {
          chainOrder = await blockchainService.getOrder(id);
        } catch (error) {
          console.warn('查询链上订单失败:', error);
        }
      }

      res.json({
        success: true,
        data: {
          order: {
            ...order,
            metadata: order.metadata,
          },
          payments: payments.map(p => ({
            ...p,
            notify_data: p.notify_data,
          })),
          alipayStatus,
          chainOrder,
        },
      });
    } catch (error: any) {
      console.error('查询订单失败:', error);
      res.status(500).json({
        success: false,
        error: '查询订单失败',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/payment/orders
 * 查询用户订单列表
 */
router.get(
  '/orders',
  [
    body('userAddress').isEthereumAddress().withMessage('无效的钱包地址'),
    body('status').optional().isIn(Object.values(OrderStatus)),
    body('limit').optional().isInt({ min: 1, max: 100 }),
    body('offset').optional().isInt({ min: 0 }),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { userAddress, status, limit = 20, offset = 0 } = req.query;

      const orders = await OrderModel.findByUserAddress(userAddress as string, {
        status: status as OrderStatus,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      // 获取用户统计
      const stats = await OrderModel.getUserStats(userAddress as string);

      res.json({
        success: true,
        data: {
          orders: orders.map(o => ({
            ...o,
            metadata: o.metadata,
          })),
          stats,
          pagination: {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            total: stats.total_orders,
          },
        },
      });
    } catch (error: any) {
      console.error('查询订单列表失败:', error);
      res.status(500).json({
        success: false,
        error: '查询订单列表失败',
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/payment/order/:id/cancel
 * 取消订单
 */
router.post(
  '/order/:id/cancel',
  [param('id').isString().notEmpty(), handleValidationErrors],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userAddress } = req.body;

      // 查询订单
      const order = await OrderModel.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: '订单不存在',
        });
      }

      // 验证用户权限
      if (order.user_address.toLowerCase() !== userAddress.toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: '无权操作此订单',
        });
      }

      // 只能取消待支付订单
      if (order.status !== OrderStatus.PENDING) {
        return res.status(400).json({
          success: false,
          error: '只能取消待支付订单',
        });
      }

      // 关闭支付宝订单
      if (alipayService.isAvailable()) {
        try {
          await alipayService.closeOrder({ outTradeNo: id });
        } catch (error) {
          console.warn('关闭支付宝订单失败:', error);
        }
      }

      // 更新订单状态
      const success = await OrderModel.markAsCancelled(id);

      if (success) {
        res.json({
          success: true,
          message: '订单已取消',
        });
      } else {
        res.status(400).json({
          success: false,
          error: '取消订单失败',
        });
      }
    } catch (error: any) {
      console.error('取消订单失败:', error);
      res.status(500).json({
        success: false,
        error: '取消订单失败',
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/payment/order/:id/refund
 * 申请退款（管理员接口）
 */
router.post(
  '/order/:id/refund',
  [
    param('id').isString().notEmpty(),
    body('refundAmount').isFloat({ min: 0.01 }),
    body('refundReason').optional().isString(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { refundAmount, refundReason } = req.body;

      // 查询订单
      const order = await OrderModel.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: '订单不存在',
        });
      }

      // 只能退款已完成订单
      if (order.status !== OrderStatus.COMPLETED) {
        return res.status(400).json({
          success: false,
          error: '只能退款已完成订单',
        });
      }

      // 支付宝退款
      let refundResult = null;
      if (alipayService.isAvailable() && order.alipay_order_no) {
        try {
          const outRequestNo = `REF${Date.now()}`;
          refundResult = await alipayService.refund({
            outTradeNo: id,
            refundAmount: parseFloat(refundAmount),
            refundReason: refundReason || '用户申请退款',
            outRequestNo,
          });
        } catch (error) {
          console.error('支付宝退款失败:', error);
          return res.status(500).json({
            success: false,
            error: '支付宝退款失败',
          });
        }
      }

      // 更新订单状态
      await OrderModel.markAsRefunded(id);

      // 扣除用户AGC余额
      await AGCBalanceModel.subtractBalance(
        order.user_address,
        order.points_amount,
        AGCTransactionType.REFUND,
        {
          order_id: id,
          description: refundReason || '订单退款',
        }
      );

      res.json({
        success: true,
        data: {
          orderId: id,
          refundResult,
        },
      });
    } catch (error: any) {
      console.error('退款失败:', error);
      res.status(500).json({
        success: false,
        error: '退款失败',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/payment/balance/:userAddress
 * 查询用户AGC余额
 */
router.get(
  '/balance/:userAddress',
  [param('userAddress').isEthereumAddress(), handleValidationErrors],
  async (req: Request, res: Response) => {
    try {
      const { userAddress } = req.params;

      // 查询数据库余额
      const balance = await AGCBalanceModel.getBalance(userAddress.toLowerCase());
      const stats = await AGCBalanceModel.getUserStats(userAddress.toLowerCase());

      // 查询链上余额
      let chainBalance = '0';
      if (blockchainService.isAvailable()) {
        try {
          chainBalance = await blockchainService.getPointsBalance(userAddress);
        } catch (error) {
          console.warn('查询链上余额失败:', error);
        }
      }

      res.json({
        success: true,
        data: {
          balance,
          chainBalance,
          stats,
        },
      });
    } catch (error: any) {
      console.error('查询余额失败:', error);
      res.status(500).json({
        success: false,
        error: '查询余额失败',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/payment/transactions/:userAddress
 * 查询用户交易记录
 */
router.get(
  '/transactions/:userAddress',
  [
    param('userAddress').isEthereumAddress(),
    body('type').optional().isIn(Object.values(AGCTransactionType)),
    body('limit').optional().isInt({ min: 1, max: 100 }),
    body('offset').optional().isInt({ min: 0 }),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { userAddress } = req.params;
      const { type, limit = 20, offset = 0 } = req.query;

      const transactions = await AGCBalanceModel.getTransactions(
        userAddress.toLowerCase(),
        {
          type: type as AGCTransactionType,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        }
      );

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
          },
        },
      });
    } catch (error: any) {
      console.error('查询交易记录失败:', error);
      res.status(500).json({
        success: false,
        error: '查询交易记录失败',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/payment/config
 * 获取支付配置
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    // 获取汇率
    let exchangeRate = 10; // 默认 1元 = 10 AGC
    if (blockchainService.isAvailable()) {
      try {
        exchangeRate = await blockchainService.getExchangeRate();
        exchangeRate = exchangeRate / 1e18; // 转换为可读格式
      } catch (error) {
        console.warn('获取链上汇率失败:', error);
      }
    }

    res.json({
      success: true,
      data: {
        alipayEnabled: alipayService.isAvailable(),
        blockchainEnabled: blockchainService.isAvailable(),
        sandbox: process.env.ALIPAY_SANDBOX === 'true',
        exchangeRate,
        minAmount: 1,
        maxAmount: 100000,
        contractAddress: blockchainService.getContractAddress(),
      },
    });
  } catch (error: any) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      success: false,
      error: '获取配置失败',
      message: error.message,
    });
  }
});

export default router;
