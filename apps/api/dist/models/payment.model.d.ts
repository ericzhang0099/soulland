export declare enum PaymentType {
    ALIPAY = "alipay",
    WECHAT = "wechat",
    CRYPTO = "crypto"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export interface Payment {
    id: number;
    order_id: string;
    payment_type: PaymentType;
    transaction_hash: string | null;
    alipay_trade_no: string | null;
    amount: number;
    currency: string;
    status: PaymentStatus;
    notify_data: any;
    error_message: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface CreatePaymentParams {
    order_id: string;
    payment_type: PaymentType;
    amount: number;
    currency: string;
    alipay_trade_no?: string;
    transaction_hash?: string;
}
/**
 * 支付记录模型类
 */
export declare class PaymentModel {
    /**
     * 创建支付记录
     */
    static create(params: CreatePaymentParams): Promise<Payment>;
    /**
     * 根据ID查找支付记录
     */
    static findById(id: number): Promise<Payment | null>;
    /**
     * 根据订单ID查找支付记录
     */
    static findByOrderId(orderId: string): Promise<Payment[]>;
    /**
     * 根据支付宝交易号查找支付记录
     */
    static findByAlipayTradeNo(tradeNo: string): Promise<Payment | null>;
    /**
     * 根据交易哈希查找支付记录
     */
    static findByTransactionHash(hash: string): Promise<Payment | null>;
    /**
     * 更新支付状态为成功
     */
    static markAsSuccess(id: number, data?: {
        notify_data?: any;
        transaction_hash?: string;
    }): Promise<boolean>;
    /**
     * 更新支付状态为失败
     */
    static markAsFailed(id: number, errorMessage: string): Promise<boolean>;
    /**
     * 更新支付状态为已退款
     */
    static markAsRefunded(id: number): Promise<boolean>;
    /**
     * 更新支付记录
     */
    static update(id: number, data: Partial<Payment>): Promise<boolean>;
    /**
     * 格式化支付记录数据
     */
    private static formatPayment;
}
export default PaymentModel;
//# sourceMappingURL=payment.model.d.ts.map