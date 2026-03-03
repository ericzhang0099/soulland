"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModel = exports.PaymentStatus = exports.PaymentType = void 0;
const database_1 = __importDefault(require("../config/database"));
// 支付类型枚举
var PaymentType;
(function (PaymentType) {
    PaymentType["ALIPAY"] = "alipay";
    PaymentType["WECHAT"] = "wechat";
    PaymentType["CRYPTO"] = "crypto";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
// 支付状态枚举
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["SUCCESS"] = "success";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
/**
 * 支付记录模型类
 */
class PaymentModel {
    /**
     * 创建支付记录
     */
    static async create(params) {
        const { order_id, payment_type, amount, currency, alipay_trade_no, transaction_hash } = params;
        const [result] = await database_1.default.execute(`INSERT INTO payments (order_id, payment_type, amount, currency, alipay_trade_no, transaction_hash, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [order_id, payment_type, amount, currency, alipay_trade_no || null, transaction_hash || null, PaymentStatus.PENDING]);
        if (result.affectedRows === 0) {
            throw new Error('创建支付记录失败');
        }
        return this.findById(result.insertId);
    }
    /**
     * 根据ID查找支付记录
     */
    static async findById(id) {
        const [rows] = await database_1.default.execute('SELECT * FROM payments WHERE id = ?', [id]);
        if (rows.length === 0)
            return null;
        return this.formatPayment(rows[0]);
    }
    /**
     * 根据订单ID查找支付记录
     */
    static async findByOrderId(orderId) {
        const [rows] = await database_1.default.execute('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC', [orderId]);
        return rows.map(row => this.formatPayment(row));
    }
    /**
     * 根据支付宝交易号查找支付记录
     */
    static async findByAlipayTradeNo(tradeNo) {
        const [rows] = await database_1.default.execute('SELECT * FROM payments WHERE alipay_trade_no = ?', [tradeNo]);
        if (rows.length === 0)
            return null;
        return this.formatPayment(rows[0]);
    }
    /**
     * 根据交易哈希查找支付记录
     */
    static async findByTransactionHash(hash) {
        const [rows] = await database_1.default.execute('SELECT * FROM payments WHERE transaction_hash = ?', [hash]);
        if (rows.length === 0)
            return null;
        return this.formatPayment(rows[0]);
    }
    /**
     * 更新支付状态为成功
     */
    static async markAsSuccess(id, data) {
        const updates = ['status = ?'];
        const params = [PaymentStatus.SUCCESS];
        if (data?.notify_data) {
            updates.push('notify_data = ?');
            params.push(JSON.stringify(data.notify_data));
        }
        if (data?.transaction_hash) {
            updates.push('transaction_hash = ?');
            params.push(data.transaction_hash);
        }
        params.push(id);
        const [result] = await database_1.default.execute(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`, params);
        return result.affectedRows > 0;
    }
    /**
     * 更新支付状态为失败
     */
    static async markAsFailed(id, errorMessage) {
        const [result] = await database_1.default.execute('UPDATE payments SET status = ?, error_message = ? WHERE id = ?', [PaymentStatus.FAILED, errorMessage, id]);
        return result.affectedRows > 0;
    }
    /**
     * 更新支付状态为已退款
     */
    static async markAsRefunded(id) {
        const [result] = await database_1.default.execute('UPDATE payments SET status = ? WHERE id = ?', [PaymentStatus.REFUNDED, id]);
        return result.affectedRows > 0;
    }
    /**
     * 更新支付记录
     */
    static async update(id, data) {
        const updates = [];
        const params = [];
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
                updates.push(`${key} = ?`);
                params.push(typeof value === 'object' ? JSON.stringify(value) : value);
            }
        }
        if (updates.length === 0)
            return false;
        params.push(id);
        const [result] = await database_1.default.execute(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`, params);
        return result.affectedRows > 0;
    }
    /**
     * 格式化支付记录数据
     */
    static formatPayment(row) {
        return {
            ...row,
            notify_data: row.notify_data ? JSON.parse(row.notify_data) : null,
        };
    }
}
exports.PaymentModel = PaymentModel;
exports.default = PaymentModel;
//# sourceMappingURL=payment.model.js.map