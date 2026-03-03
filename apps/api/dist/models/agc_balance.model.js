"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGCBalanceModel = exports.AGCTransactionType = void 0;
const database_1 = __importDefault(require("../config/database"));
// AGC交易类型枚举
var AGCTransactionType;
(function (AGCTransactionType) {
    AGCTransactionType["PURCHASE"] = "purchase";
    AGCTransactionType["SPEND"] = "spend";
    AGCTransactionType["REFUND"] = "refund";
    AGCTransactionType["REWARD"] = "reward";
    AGCTransactionType["TRANSFER_IN"] = "transfer_in";
    AGCTransactionType["TRANSFER_OUT"] = "transfer_out";
})(AGCTransactionType || (exports.AGCTransactionType = AGCTransactionType = {}));
/**
 * AGC积分余额模型类
 */
class AGCBalanceModel {
    /**
     * 获取或创建用户余额记录
     */
    static async getOrCreate(userAddress) {
        const [rows] = await database_1.default.execute('SELECT * FROM agc_balances WHERE user_address = ?', [userAddress]);
        if (rows.length > 0) {
            return rows[0];
        }
        // 创建新记录
        const [result] = await database_1.default.execute('INSERT INTO agc_balances (user_address, balance, total_earned, total_spent) VALUES (?, 0, 0, 0)', [userAddress]);
        return {
            id: result.insertId,
            user_address: userAddress,
            balance: 0,
            total_earned: 0,
            total_spent: 0,
            last_updated: new Date(),
            created_at: new Date(),
        };
    }
    /**
     * 获取用户余额
     */
    static async getBalance(userAddress) {
        const balance = await this.getOrCreate(userAddress);
        return balance.balance;
    }
    /**
     * 增加用户余额（购买、奖励等）
     */
    static async addBalance(userAddress, amount, transactionType, data) {
        const connection = await database_1.default.getConnection();
        try {
            await connection.beginTransaction();
            // 更新余额
            const [result] = await connection.execute(`UPDATE agc_balances 
         SET balance = balance + ?, total_earned = total_earned + ?
         WHERE user_address = ?`, [amount, amount, userAddress]);
            if (result.affectedRows === 0) {
                // 用户记录不存在，创建新记录
                await connection.execute(`INSERT INTO agc_balances (user_address, balance, total_earned, total_spent) 
           VALUES (?, ?, ?, 0)`, [userAddress, amount, amount]);
            }
            // 创建交易记录
            await connection.execute(`INSERT INTO agc_transactions 
         (user_address, transaction_type, amount, order_id, transaction_hash, description)
         VALUES (?, ?, ?, ?, ?, ?)`, [
                userAddress,
                transactionType,
                amount,
                data?.order_id || null,
                data?.transaction_hash || null,
                data?.description || null,
            ]);
            await connection.commit();
            return true;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    /**
     * 减少用户余额（消费等）
     */
    static async subtractBalance(userAddress, amount, transactionType, data) {
        const connection = await database_1.default.getConnection();
        try {
            await connection.beginTransaction();
            // 检查余额是否充足
            const [rows] = await connection.execute('SELECT balance FROM agc_balances WHERE user_address = ?', [userAddress]);
            if (rows.length === 0 || rows[0].balance < amount) {
                throw new Error('余额不足');
            }
            // 更新余额
            await connection.execute(`UPDATE agc_balances 
         SET balance = balance - ?, total_spent = total_spent + ?
         WHERE user_address = ?`, [amount, amount, userAddress]);
            // 创建交易记录
            await connection.execute(`INSERT INTO agc_transactions 
         (user_address, transaction_type, amount, order_id, transaction_hash, description)
         VALUES (?, ?, ?, ?, ?, ?)`, [
                userAddress,
                transactionType,
                -amount,
                data?.order_id || null,
                data?.transaction_hash || null,
                data?.description || null,
            ]);
            await connection.commit();
            return true;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    /**
     * 退款（恢复余额）
     */
    static async refund(userAddress, amount, orderId, transactionHash) {
        return this.addBalance(userAddress, amount, AGCTransactionType.REFUND, {
            order_id: orderId,
            transaction_hash: transactionHash,
            description: '订单退款',
        });
    }
    /**
     * 获取用户交易记录
     */
    static async getTransactions(userAddress, options) {
        let sql = 'SELECT * FROM agc_transactions WHERE user_address = ?';
        const params = [userAddress];
        if (options?.type) {
            sql += ' AND transaction_type = ?';
            params.push(options.type);
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
        return rows;
    }
    /**
     * 获取用户统计信息
     */
    static async getUserStats(userAddress) {
        const [[balanceRow], [countRow]] = await Promise.all([
            database_1.default.execute('SELECT balance, total_earned, total_spent FROM agc_balances WHERE user_address = ?', [userAddress]),
            database_1.default.execute('SELECT COUNT(*) as count FROM agc_transactions WHERE user_address = ?', [userAddress]),
        ]);
        return {
            balance: balanceRow[0]?.balance || 0,
            total_earned: balanceRow[0]?.total_earned || 0,
            total_spent: balanceRow[0]?.total_spent || 0,
            transaction_count: countRow[0]?.count || 0,
        };
    }
}
exports.AGCBalanceModel = AGCBalanceModel;
exports.default = AGCBalanceModel;
//# sourceMappingURL=agc_balance.model.js.map