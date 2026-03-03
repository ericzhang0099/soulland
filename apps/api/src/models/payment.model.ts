import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// 支付类型枚举
export enum PaymentType {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  CRYPTO = 'crypto',
}

// 支付状态枚举
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// 支付记录接口
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

// 创建支付记录参数
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
export class PaymentModel {
  /**
   * 创建支付记录
   */
  static async create(params: CreatePaymentParams): Promise<Payment> {
    const { order_id, payment_type, amount, currency, alipay_trade_no, transaction_hash } = params;
    
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO payments (order_id, payment_type, amount, currency, alipay_trade_no, transaction_hash, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [order_id, payment_type, amount, currency, alipay_trade_no || null, transaction_hash || null, PaymentStatus.PENDING]
    );

    if (result.affectedRows === 0) {
      throw new Error('创建支付记录失败');
    }

    return this.findById(result.insertId) as Promise<Payment>;
  }

  /**
   * 根据ID查找支付记录
   */
  static async findById(id: number): Promise<Payment | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;
    return this.formatPayment(rows[0]);
  }

  /**
   * 根据订单ID查找支付记录
   */
  static async findByOrderId(orderId: string): Promise<Payment[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC',
      [orderId]
    );

    return rows.map(row => this.formatPayment(row));
  }

  /**
   * 根据支付宝交易号查找支付记录
   */
  static async findByAlipayTradeNo(tradeNo: string): Promise<Payment | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE alipay_trade_no = ?',
      [tradeNo]
    );

    if (rows.length === 0) return null;
    return this.formatPayment(rows[0]);
  }

  /**
   * 根据交易哈希查找支付记录
   */
  static async findByTransactionHash(hash: string): Promise<Payment | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE transaction_hash = ?',
      [hash]
    );

    if (rows.length === 0) return null;
    return this.formatPayment(rows[0]);
  }

  /**
   * 更新支付状态为成功
   */
  static async markAsSuccess(
    id: number,
    data?: { notify_data?: any; transaction_hash?: string }
  ): Promise<boolean> {
    const updates: string[] = ['status = ?'];
    const params: any[] = [PaymentStatus.SUCCESS];

    if (data?.notify_data) {
      updates.push('notify_data = ?');
      params.push(JSON.stringify(data.notify_data));
    }

    if (data?.transaction_hash) {
      updates.push('transaction_hash = ?');
      params.push(data.transaction_hash);
    }

    params.push(id);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE payments SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新支付状态为失败
   */
  static async markAsFailed(id: number, errorMessage: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE payments SET status = ?, error_message = ? WHERE id = ?',
      [PaymentStatus.FAILED, errorMessage, id]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新支付状态为已退款
   */
  static async markAsRefunded(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE payments SET status = ? WHERE id = ?',
      [PaymentStatus.REFUNDED, id]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新支付记录
   */
  static async update(id: number, data: Partial<Payment>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        updates.push(`${key} = ?`);
        params.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    }

    if (updates.length === 0) return false;

    params.push(id);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE payments SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return result.affectedRows > 0;
  }

  /**
   * 格式化支付记录数据
   */
  private static formatPayment(row: RowDataPacket): Payment {
    return {
      ...row,
      notify_data: row.notify_data ? JSON.parse(row.notify_data) : null,
    };
  }
}

export default PaymentModel;
