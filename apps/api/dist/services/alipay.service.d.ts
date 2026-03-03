/**
 * 创建支付订单参数
 */
interface CreateOrderParams {
    outTradeNo: string;
    totalAmount: number;
    subject: string;
    body?: string;
    returnUrl?: string;
    notifyUrl?: string;
    quitUrl?: string;
}
/**
 * 支付结果查询参数
 */
interface QueryOrderParams {
    outTradeNo?: string;
    tradeNo?: string;
}
/**
 * 退款参数
 */
interface RefundParams {
    outTradeNo?: string;
    tradeNo?: string;
    refundAmount: number;
    refundReason?: string;
    outRequestNo: string;
}
/**
 * 支付宝服务类 - 使用 alipay-sdk
 */
declare class AlipayService {
    private sdk;
    private config;
    private isSandbox;
    constructor();
    /**
     * 初始化支付宝SDK
     */
    private initialize;
    /**
     * 检查服务是否可用
     */
    isAvailable(): boolean;
    /**
     * 格式化密钥
     */
    private formatKey;
    /**
     * 将字符串分块
     */
    private chunkString;
    /**
     * 生成订单号
     */
    generateOrderId(): string;
    /**
     * 创建电脑网站支付
     * 返回跳转URL
     */
    createPagePay(params: CreateOrderParams): Promise<string>;
    /**
     * 创建手机网站支付
     */
    createWapPay(params: CreateOrderParams): Promise<string>;
    /**
     * 创建APP支付
     */
    createAppPay(params: CreateOrderParams): Promise<string>;
    /**
     * 查询订单
     */
    queryOrder(params: QueryOrderParams): Promise<any>;
    /**
     * 关闭订单
     */
    closeOrder(params: QueryOrderParams): Promise<any>;
    /**
     * 申请退款
     */
    refund(params: RefundParams): Promise<any>;
    /**
     * 查询退款
     */
    queryRefund(params: {
        outTradeNo?: string;
        tradeNo?: string;
        outRequestNo: string;
    }): Promise<any>;
    /**
     * 验证异步通知签名
     */
    verifyNotify(params: Record<string, any>): boolean;
    /**
     * 验证同步通知签名
     */
    verifyReturn(params: Record<string, any>): boolean;
    /**
     * 获取支付宝通知ID
     */
    getNotifyId(params: Record<string, any>): string;
    /**
     * 解析通知数据
     */
    parseNotify(params: Record<string, any>): {
        notifyId: string;
        notifyType: string;
        outTradeNo: string;
        tradeNo: string;
        tradeStatus: string;
        totalAmount: number;
        buyerId: string;
        buyerLogonId: string;
        gmtPayment?: string;
        [key: string]: any;
    };
    /**
     * 检查交易是否成功
     */
    isTradeSuccess(tradeStatus: string): boolean;
    /**
     * 检查交易是否关闭
     */
    isTradeClosed(tradeStatus: string): boolean;
    /**
     * 检查交易是否等待付款
     */
    isTradePending(tradeStatus: string): boolean;
}
declare const _default: AlipayService;
export default _default;
//# sourceMappingURL=alipay.service.d.ts.map