import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// AGC交易类型枚举
export enum AGCTransactionType {
  PURCHASE = 'purchase',
  SPEND = 'spend',
  REFUND = 'refund',
  REWARD = 'reward',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
}

// AGC余额接口
export interface AGCBalance {
  id: number;
  user_address: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  last_updated: Date;
  created_at: Date;
}

// AGC交易记录接口
export interface AGCTransaction {
  id: number;
  user_address: string;
  transaction_type: AGCTransactionType;
  amount: number;
  order_id: string | null;
  transaction_hash: string | null;
  description: string | null;
  created_at: Date;
}

/**
 * AGC积分余额模型类
 */
export class AGCBalanceModel {
  /**
   * 获取或创建用户余额记录
   */
  static async getOrCreate(userAddress: string): Promise<AGCBalance> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM agc_balances WHERE user_address = ?',
      [userAddress]
    );

    if (rows.length > 0) {
      return rows[0] as AGCBalance;
    }

    // 创建新记录
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO agc_balances (user_address, balance, total_earned, total_spent) VALUES (?, 0, 0, 0)',
      [userAddress]
    );

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
  static async getBalance(userAddress: string): Promise<number> {
    const balance = await this.getOrCreate(userAddress);
    return balance.balance;
  }

  /**
   * 增加用户余额（购买、奖励等）
   */
  static async addBalance(
    userAddress: string,
    amount: number,
    transactionType: AGCTransactionType,
    data?: { order_id?: string; transaction_hash?: string; description?: string }
  ): Promise<boolean> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 更新余额
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE agc_balances 
         SET balance = balance + ?, total_earned = total_earned + ?
         WHERE user_address = ?`,
        [amount, amount, userAddress]
      );

      if (result.affectedRows === 0) {
        // 用户记录不存在，创建新记录
        await connection.execute<ResultSetHeader>(
          `INSERT INTO agc_balances (user_address, balance, total_earned, total_spent) 
           VALUES (?, ?, ?, 0)`,
          [userAddress, amount, amount]
        );
      }

      // 创建交易记录
      await connection.execute<ResultSetHeader>(
        `INSERT INTO agc_transactions 
         (user_address, transaction_type, amount, order_id, transaction_hash, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userAddress,
          transactionType,
          amount,
          data?.order_id || null,
          data?.transaction_hash || null,
          data?.description || null,
        ]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 减少用户余额（消费等）
   */
  static async subtractBalance(
    userAddress: string,
    amount: number,
    transactionType: AGCTransactionType,
    data?: { order_id?: string; transaction_hash?: string; description?: string }
  ): Promise<boolean> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 检查余额是否充足
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT balance FROM agc_balances WHERE user_address = ?',
        [userAddress]
      );

      if (rows.length === 0 || rows[0].balance < amount) {
        throw new Error('余额不足');
      }

      // 更新余额
      await connection.execute<ResultSetHeader>(
        `UPDATE agc_balances 
         SET balance = balance - ?, total_spent = total_spent + ?
         WHERE user_address = ?`,
        [amount, amount, userAddress]
      );

      // 创建交易记录
      await connection.execute<ResultSetHeader>(
        `INSERT INTO agc_transactions 
         (user_address, transaction_type, amount, order_id, transaction_hash, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userAddress,
          transactionType,
          -amount,
          data?.order_id || null,
          data?.transaction_hash || null,
          data?.description || null,
        ]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 退款（恢复余额）
   */
  static async refund(
    userAddress: string,
    amount: number,
    orderId: string,
    transactionHash?: string
  ): Promise<boolean> {
    return this.addBalance(userAddress, amount, AGCTransactionType.REFUND, {
      order_id: orderId,
      transaction_hash: transactionHash,
      description: '订单退款',
    });
  }

  /**
   * 获取用户交易记录
   */
  static async getTransactions(
    userAddress: string,
    options?: { limit?: number; offset?: number; type?: AGCTransactionType }
  ): Promise<AGCTransaction[]> {
    let sql = 'SELECT * FROM agc_transactions WHERE user_address = ?';
    const params: any[] = [userAddress];

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

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    return rows as AGCTransaction[];
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStats(userAddress: string): Promise<{
    balance: number;
    total_earned: number;
    total_spent: number;
    transaction_count: number;
  }> {
    const [[balanceRow], [countRow]] = await Promise.all([
      pool.execute<RowDataPacket[]>(
        'SELECT balance, total_earned, total_spent FROM agc_balances WHERE user_address = ?',
        [userAddress]
      ),
      pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM agc_transactions WHERE user_address = ?',
        [userAddress]
      ),
    ]);

    return {
      balance: balanceRow[0]?.balance || 0,
      total_earned: balanceRow[0]?.total_earned || 0,
      total_spent: balanceRow[0]?.total_spent || 0,
      transaction_count: countRow[0]?.count || 0,
    };
  }
}

export default AGCBalanceModel;
