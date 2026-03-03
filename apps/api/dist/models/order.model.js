"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModel = exports.OrderStatus = void 0;
const database_1 = __importDefault(require("../config/database"));
// 订单状态枚举
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["PAID"] = "paid";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["REFUNDED"] = "refunded";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
/**
 * 订单模型类
 */
class OrderModel {
    /**
     * 创建新订单
     */
    static async create(params) {
        const { id, user_address, amount_cny, points_amount, metadata } = params;
        const [result] = await database_1.default.execute(`INSERT INTO orders (id, user_address, amount_cny, points_amount, metadata, status)
       VALUES (?, ?, ?, ?, ?, ?)`, [id, user_address, amount_cny, points_amount, JSON.stringify(metadata || {}), OrderStatus.PENDING]);
        if (result.affectedRows === 0) {
            throw new Error('创建订单失败');
        }
        return this.findById(id);
    }
    /**
     * 根据ID查找订单
     */
    static async findById(id) {
        const [rows] = await database_1.default.execute('SELECT * FROM orders WHERE id = ?', [id]);
        if (rows.length === 0)
            return null;
        return this.formatOrder(rows[0]);
    }
    /**
     * 根据支付宝订单号查找订单
     */
    static async findByAlipayOrderNo(alipayOrderNo) {
        const [rows] = await database_1.default.execute('SELECT * FROM orders WHERE alipay_order_no = ?', [alipayOrderNo]);
        if (rows.length === 0)
            return null;
        return this.formatOrder(rows[0]);
    }
    /**
     * 查找用户订单列表
     */
    static async findByUserAddress(userAddress, options) {
        let sql = 'SELECT * FROM orders WHERE user_address = ?';
        const params = [userAddress];
        if (options?.status) {
            sql += ' AND status = ?';
            params.push(options.status);
        }
        sql += ' ORDER BY created_at DESC';
        if (options?.limit) {
            sql += ' LIMIT ?';
            params.push(options.limit);
            if (options?.offset) {
                sql += ' OFFSET ?';
                params.push(options.offset);
            }
        }
        const [rows] = await database_1.default.execute(sql, params);
        return rows.map(row => this.formatOrder(row));
    }
    /**
     * 更新订单状态为已支付
     */
    static async markAsPaid(id, alipayOrderNo) {
        const [result] = await database_1.default.execute(`UPDATE orders 
       SET status = ?, alipay_order_no = ?, paid_at = NOW()
       WHERE id = ? AND status = ?`, [OrderStatus.PAID, alipayOrderNo, id, OrderStatus.PENDING]);
        return result.affectedRows > 0;
    }
    /**
     * 更新订单状态为已完成
     */
    static async markAsCompleted(id) {
        const [result] = await database_1.default.execute(`UPDATE orders 
       SET status = ?, completed_at = NOW()
       WHERE id = ? AND status = ?`, [OrderStatus.COMPLETED, id, OrderStatus.PAID]);
        return result.affectedRows > 0;
    }
    /**
     * 更新订单状态为已取消
     */
    static async markAsCancelled(id) {
        const [result] = await database_1.default.execute(`UPDATE orders 
       SET status = ?, cancelled_at = NOW()
       WHERE id = ? AND status = ?`, [OrderStatus.CANCELLED, id, OrderStatus.PENDING]);
        return result.affectedRows > 0;
    }
    /**
     * 更新订单状态为已退款
     */
    static async markAsRefunded(id) {
        const [result] = await database_1.default.execute(`UPDATE orders 
       SET status = ?, refunded_at = NOW()
       WHERE id = ? AND status = ?`, [OrderStatus.REFUNDED, id, OrderStatus.COMPLETED]);
        return result.affectedRows > 0;
    }
    /**
     * 获取用户订单统计
     */
    static async getUserStats(userAddress) {
        const [rows] = await database_1.default.execute(`SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status IN ('paid', 'completed') THEN 1 ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as total_completed,
        SUM(CASE WHEN status = 'completed' THEN amount_cny ELSE 0 END) as total_amount
       FROM orders 
       WHERE user_address = ?`, [userAddress]);
        return rows[0];
    }
    /**
     * 格式化订单数据
     */
    static formatOrder(row) {
        return {
            ...row,
            metadata: row.metadata ? JSON.parse(row.metadata) : null,
        };
    }
}
exports.OrderModel = OrderModel;
exports.default = OrderModel;
//# sourceMappingURL=order.model.js.map