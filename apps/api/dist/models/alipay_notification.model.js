"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlipayNotificationModel = void 0;
const database_1 = __importDefault(require("../config/database"));
/**
 * 支付宝通知模型类
 */
class AlipayNotificationModel {
    /**
     * 创建通知记录
     */
    static async create(params) {
        const { notify_id, notify_type, out_trade_no, trade_no, trade_status, total_amount, buyer_id, buyer_logon_id, notify_data, verified, } = params;
        const [result] = await database_1.default.execute(`INSERT INTO alipay_notifications 
       (notify_id, notify_type, out_trade_no, trade_no, trade_status, total_amount, 
        buyer_id, buyer_logon_id, notify_data, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            notify_id,
            notify_type,
            out_trade_no,
            trade_no,
            trade_status,
            total_amount,
            buyer_id || null,
            buyer_logon_id || null,
            JSON.stringify(notify_data),
            verified,
        ]);
        return this.findById(result.insertId);
    }
    /**
     * 根据ID查找通知
     */
    static async findById(id) {
        const [rows] = await database_1.default.execute('SELECT * FROM alipay_notifications WHERE id = ?', [id]);
        if (rows.length === 0)
            return null;
        return this.formatNotification(rows[0]);
    }
    /**
     * 根据通知ID查找
     */
    static async findByNotifyId(notifyId) {
        const [rows] = await database_1.default.execute('SELECT * FROM alipay_notifications WHERE notify_id = ?', [notifyId]);
        if (rows.length === 0)
            return null;
        return this.formatNotification(rows[0]);
    }
    /**
     * 根据商户订单号查找通知
     */
    static async findByOutTradeNo(outTradeNo) {
        const [rows] = await database_1.default.execute('SELECT * FROM alipay_notifications WHERE out_trade_no = ? ORDER BY created_at DESC', [outTradeNo]);
        return rows.map(row => this.formatNotification(row));
    }
    /**
     * 查找未处理的通知
     */
    static async findUnprocessed(limit = 100) {
        const [rows] = await database_1.default.execute('SELECT * FROM alipay_notifications WHERE processed = false ORDER BY created_at ASC LIMIT ?', [limit]);
        return rows.map(row => this.formatNotification(row));
    }
    /**
     * 标记通知为已处理
     */
    static async markAsProcessed(id) {
        const [result] = await database_1.default.execute('UPDATE alipay_notifications SET processed = true, processed_at = NOW() WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
    /**
     * 检查通知是否已存在
     */
    static async exists(notifyId) {
        const [rows] = await database_1.default.execute('SELECT 1 FROM alipay_notifications WHERE notify_id = ?', [notifyId]);
        return rows.length > 0;
    }
    /**
     * 格式化通知数据
     */
    static formatNotification(row) {
        return {
            ...row,
            notify_data: row.notify_data ? JSON.parse(row.notify_data) : null,
        };
    }
}
exports.AlipayNotificationModel = AlipayNotificationModel;
exports.default = AlipayNotificationModel;
//# sourceMappingURL=alipay_notification.model.js.map