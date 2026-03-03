export declare enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export interface Order {
    id: string;
    user_address: string;
    amount_cny: number;
    points_amount: number;
    status: OrderStatus;
    alipay_order_no: string | null;
    metadata: any;
    created_at: Date;
    paid_at: Date | null;
    completed_at: Date | null;
    cancelled_at: Date | null;
    refunded_at: Date | null;
}
export interface CreateOrderParams {
    id: string;
    user_address: string;
    amount_cny: number;
    points_amount: number;
    metadata?: any;
}
/**
 * 订单模型类
 */
export declare class OrderModel {
    /**
     * 创建新订单
     */
    static create(params: CreateOrderParams): Promise<Order>;
    /**
     * 根据ID查找订单
     */
    static findById(id: string): Promise<Order | null>;
    /**
     * 根据支付宝订单号查找订单
     */
    static findByAlipayOrderNo(alipayOrderNo: string): Promise<Order | null>;
    /**
     * 查找用户订单列表
     */
    static findByUserAddress(userAddress: string, options?: {
        status?: OrderStatus;
        limit?: number;
        offset?: number;
    }): Promise<Order[]>;
    /**
     * 更新订单状态为已支付
     */
    static markAsPaid(id: string, alipayOrderNo: string): Promise<boolean>;
    /**
     * 更新订单状态为已完成
     */
    static markAsCompleted(id: string): Promise<boolean>;
    /**
     * 更新订单状态为已取消
     */
    static markAsCancelled(id: string): Promise<boolean>;
    /**
     * 更新订单状态为已退款
     */
    static markAsRefunded(id: string): Promise<boolean>;
    /**
     * 获取用户订单统计
     */
    static getUserStats(userAddress: string): Promise<{
        total_orders: number;
        total_paid: number;
        total_completed: number;
        total_amount: number;
    }>;
    /**
     * 格式化订单数据
     */
    private static formatOrder;
}
export default OrderModel;
//# sourceMappingURL=order.model.d.ts.map