"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const alipay_sdk_1 = __importDefault(require("alipay-sdk"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * 支付宝服务类 - 使用 alipay-sdk
 */
class AlipayService {
    constructor() {
        this.sdk = null;
        this.config = null;
        this.isSandbox = false;
        this.initialize();
    }
    /**
     * 初始化支付宝SDK
     */
    initialize() {
        try {
            const appId = process.env.ALIPAY_APP_ID;
            const privateKey = this.formatKey(process.env.ALIPAY_APP_PRIVATE_KEY || '', 'private');
            const alipayPublicKey = this.formatKey(process.env.ALIPAY_PUBLIC_KEY || '', 'public');
            if (!appId || !privateKey || !alipayPublicKey) {
                console.warn('支付宝配置缺失，支付功能不可用');
                return;
            }
            this.isSandbox = process.env.ALIPAY_SANDBOX === 'true';
            this.config = {
                appId,
                privateKey,
                alipayPublicKey,
                gatewayUrl: this.isSandbox
                    ? 'https://openapi.alipaydev.com/gateway.do'
                    : 'https://openapi.alipay.com/gateway.do',
                signType: 'RSA2',
                charset: 'utf-8',
                timeout: 30000,
                camelcase: true,
            };
            this.sdk = new alipay_sdk_1.default(this.config);
            console.log(`支付宝SDK初始化成功 (${this.isSandbox ? '沙箱' : '生产'}环境)`);
        }
        catch (error) {
            console.error('支付宝SDK初始化失败:', error);
        }
    }
    /**
     * 检查服务是否可用
     */
    isAvailable() {
        return this.sdk !== null;
    }
    /**
     * 格式化密钥
     */
    formatKey(key, type) {
        if (!key)
            return '';
        // 如果已经包含PEM头，直接返回
        if (key.includes('-----BEGIN')) {
            return key;
        }
        // 移除所有空白字符
        key = key.replace(/\s/g, '');
        // 添加PEM格式
        if (type === 'private') {
            return `-----BEGIN RSA PRIVATE KEY-----\n${this.chunkString(key, 64)}\n-----END RSA PRIVATE KEY-----`;
        }
        else {
            return `-----BEGIN PUBLIC KEY-----\n${this.chunkString(key, 64)}\n-----END PUBLIC KEY-----`;
        }
    }
    /**
     * 将字符串分块
     */
    chunkString(str, size) {
        const chunks = [];
        for (let i = 0; i < str.length; i += size) {
            chunks.push(str.substring(i, i + size));
        }
        return chunks.join('\n');
    }
    /**
     * 生成订单号
     */
    generateOrderId() {
        const prefix = 'GLP';
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}${date}${timestamp}${random}`;
    }
    /**
     * 创建电脑网站支付
     * 返回跳转URL
     */
    async createPagePay(params) {
        if (!this.sdk) {
            throw new Error('支付宝SDK未初始化');
        }
        try {
            const bizContent = {
                out_trade_no: params.outTradeNo,
                total_amount: params.totalAmount.toFixed(2),
                subject: params.subject,
                body: params.body || '',
                product_code: 'FAST_INSTANT_TRADE_PAY',
            };
            const result = await this.sdk.exec('alipay.trade.page.pay', {
                notify_url: params.notifyUrl || process.env.ALIPAY_NOTIFY_URL,
                return_url: params.returnUrl || process.env.ALIPAY_RETURN_URL,
                bizContent,
            }, {
                validateSign: false,
            });
            // 返回支付页面URL
            return result;
        }
        catch (error) {
            console.error('创建电脑网站支付失败:', error);
            throw error;
        }
    }
    /**
     * 创建手机网站支付
     */
    async createWapPay(params) {
        if (!this.sdk) {
            throw new Error('支付宝SDK未初始化');
        }
        try {
            const bizContent = {
                out_trade_no: params.outTradeNo,
                total_amount: params.totalAmount.toFixed(2),
                subject: params.subject,
                body: params.body || '',
                product_code: 'QUICK_WAP_WAY',
                quit_url: params.quitUrl || params.returnUrl || process.env.ALIPAY_RETURN_URL,
            };
            const result = await this.sdk.exec('alipay.trade.wap.pay', {
                notify_url: params.notifyUrl || process.env.ALIPAY_NOTIFY_URL,
                return_url: params.returnUrl || process.env.ALIPAY_RETURN_URL,
                bizContent,
            }, {
                validateSign: false,
            });
            return result;
        }
        catch (error) {
            console.error('创建手机网站支付失败:', error);
            throw error;
        }
    }
    /**
     * 创建APP支付
     */
    async createAppPay(params) {
        if (!this.sdk) {
            throw new Error('支付宝SDK未初始化');
        }
        try {
            const bizContent = {
                out_trade_no: params.outTradeNo,
                total_amount: params.totalAmount.toFixed(2),
                subject: params.subject,
                body: params.body || '',
                product_code: 'QUICK_MSECURITY_PAY',
            };
            const result = await this.sdk.exec('alipay.trade.app.pay', {
                notify_url: params.notifyUrl || process.env.ALIPAY_NOTIFY_URL,
                bizContent,
            });
            // 返回给APP的支付字符串
            return result;
        }
        catch (error) {
            console.error('创建APP支付失败:', error);
            throw error;
        }
    }
    /**
     * 查询订单
     */
    async queryOrder(params) {
        if (!this.sdk) {
            throw new Error('支付宝SDK未初始化');
        }
        try {
            const bizContent = {};
            if (params.outTradeNo) {
                bizContent.out_trade_no = params.outTradeNo;
            }
            if (params.tradeNo) {
                bizContent.trade_no = params.tradeNo;
            }
            const result = await this.sdk.exec('alipay.trade.query', {
                bizContent,
            });
            return result;
        }
        catch (error) {
            console.error('查询订单失败:', error);
            throw error;
        }
    }
    /**
     * 关闭订单
     */
    async closeOrder(params) {
        if (!this.sdk) {
            throw new Error('支付宝SDK未初始化');
        }
        try {
            const bizContent = {};
            if (params.outTradeNo) {
                bizContent.out_trade_no = params.outTradeNo;
            }
            if (params.tradeNo) {
                bizContent.trade_no = params.tradeNo;
            }
            const result = await this.sdk.exec('alipay.trade.close', {
                bizContent,
            });
            return result;
        }
        catch (error) {
            console.error('关闭订单失败:', error);
            throw error;
        }
    }
    /**
     * 申请退款
     */
    async refund(params) {
        if (!this.sdk) {
            throw new Error('支付宝SDK未初始化');
        }
        try {
            const bizContent = {
                refund_amount: params.refundAmount.toFixed(2),
                refund_reason: params.refundReason || '用户申请退款',
                out_request_no: params.outRequestNo,
            };
            if (params.outTradeNo) {
                bizContent.out_trade_no = params.outTradeNo;
            }
            if (params.tradeNo) {
                bizContent.trade_no = params.tradeNo;
            }
            const result = await this.sdk.exec('alipay.trade.refund', {
                bizContent,
            });
            return result;
        }
        catch (error) {
            console.error('申请退款失败:', error);
            throw error;
        }
    }
    /**
     * 查询退款
     */
    async queryRefund(params) {
        if (!this.sdk) {
            throw new Error('支付宝SDK未初始化');
        }
        try {
            const bizContent = {
                out_request_no: params.outRequestNo,
            };
            if (params.outTradeNo) {
                bizContent.out_trade_no = params.outTradeNo;
            }
            if (params.tradeNo) {
                bizContent.trade_no = params.tradeNo;
            }
            const result = await this.sdk.exec('alipay.trade.fastpay.refund.query', {
                bizContent,
            });
            return result;
        }
        catch (error) {
            console.error('查询退款失败:', error);
            throw error;
        }
    }
    /**
     * 验证异步通知签名
     */
    verifyNotify(params) {
        if (!this.sdk) {
            console.warn('支付宝SDK未初始化，无法验证签名');
            return false;
        }
        try {
            return this.sdk.checkNotifySign(params);
        }
        catch (error) {
            console.error('验证签名失败:', error);
            return false;
        }
    }
    /**
     * 验证同步通知签名
     */
    verifyReturn(params) {
        return this.verifyNotify(params);
    }
    /**
     * 获取支付宝通知ID
     */
    getNotifyId(params) {
        return params.notify_id || '';
    }
    /**
     * 解析通知数据
     */
    parseNotify(params) {
        return {
            notifyId: params.notify_id || '',
            notifyType: params.notify_type || '',
            outTradeNo: params.out_trade_no || '',
            tradeNo: params.trade_no || '',
            tradeStatus: params.trade_status || '',
            totalAmount: parseFloat(params.total_amount) || 0,
            buyerId: params.buyer_id || '',
            buyerLogonId: params.buyer_logon_id || '',
            gmtPayment: params.gmt_payment,
            ...params,
        };
    }
    /**
     * 检查交易是否成功
     */
    isTradeSuccess(tradeStatus) {
        return tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED';
    }
    /**
     * 检查交易是否关闭
     */
    isTradeClosed(tradeStatus) {
        return tradeStatus === 'TRADE_CLOSED';
    }
    /**
     * 检查交易是否等待付款
     */
    isTradePending(tradeStatus) {
        return tradeStatus === 'WAIT_BUYER_PAY';
    }
}
exports.default = new AlipayService();
//# sourceMappingURL=alipay.service.js.map