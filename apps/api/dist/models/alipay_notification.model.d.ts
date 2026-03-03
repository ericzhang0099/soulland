export interface AlipayNotification {
    id: number;
    notify_id: string;
    notify_type: string;
    out_trade_no: string;
    trade_no: string;
    trade_status: string;
    total_amount: number;
    buyer_id: string | null;
    buyer_logon_id: string | null;
    notify_data: any;
    verified: boolean;
    processed: boolean;
    processed_at: Date | null;
    created_at: Date;
}
export interface CreateNotificationParams {
    notify_id: string;
    notify_type: string;
    out_trade_no: string;
    trade_no: string;
    trade_status: string;
    total_amount: number;
    buyer_id?: string;
    buyer_logon_id?: string;
    notify_data: any;
    verified: boolean;
}
/**
 * 支付宝通知模型类
 */
export declare class AlipayNotificationModel {
    /**
     * 创建通知记录
     */
    static create(params: CreateNotificationParams): Promise<AlipayNotification>;
    /**
     * 根据ID查找通知
     */
    static findById(id: number): Promise<AlipayNotification | null>;
    /**
     * 根据通知ID查找
     */
    static findByNotifyId(notifyId: string): Promise<AlipayNotification | null>;
    /**
     * 根据商户订单号查找通知
     */
    static findByOutTradeNo(outTradeNo: string): Promise<AlipayNotification[]>;
    /**
     * 查找未处理的通知
     */
    static findUnprocessed(limit?: number): Promise<AlipayNotification[]>;
    /**
     * 标记通知为已处理
     */
    static markAsProcessed(id: number): Promise<boolean>;
    /**
     * 检查通知是否已存在
     */
    static exists(notifyId: string): Promise<boolean>;
    /**
     * 格式化通知数据
     */
    private static formatNotification;
}
export default AlipayNotificationModel;
//# sourceMappingURL=alipay_notification.model.d.ts.map