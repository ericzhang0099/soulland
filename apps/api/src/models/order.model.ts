import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// 订单接口
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

// 创建订单参数
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
export class OrderModel {
  /**
   * 创建新订单
   */
  static async create(params: CreateOrderParams): Promise<Order> {
    const { id, user_address, amount_cny, points_amount, metadata } = params;
    
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO orders (id, user_address, amount_cny, points_amount, metadata, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, user_address, amount_cny, points_amount, JSON.stringify(metadata || {}), OrderStatus.PENDING]
    );

    if (result.affectedRows === 0) {
      throw new Error('创建订单失败');
    }

    return this.findById(id) as Promise<Order>;
  }

  /**
   * 根据ID查找订单
   */
  static async findById(id: string): Promise<Order | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;
    return this.formatOrder(rows[0]);
  }

  /**
   * 根据支付宝订单号查找订单
   */
  static async findByAlipayOrderNo(alipayOrderNo: string): Promise<Order | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE alipay_order_no = ?',
      [alipayOrderNo]
    );

    if (rows.length === 0) return null;
    return this.formatOrder(rows[0]);
  }

  /**
   * 查找用户订单列表
   */
  static async findByUserAddress(
    userAddress: string,
    options?: { status?: OrderStatus; limit?: number; offset?: number }
  ): Promise<Order[]> {
    let sql = 'SELECT * FROM orders WHERE user_address = ?';
    const params: any[] = [userAddress];

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

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    return rows.map(row => this.formatOrder(row));
  }

  /**
   * 更新订单状态为已支付
   */
  static async markAsPaid(id: string, alipayOrderNo: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE orders 
       SET status = ?, alipay_order_no = ?, paid_at = NOW()
       WHERE id = ? AND status = ?`,
      [OrderStatus.PAID, alipayOrderNo, id, OrderStatus.PENDING]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新订单状态为已完成
   */
  static async markAsCompleted(id: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE orders 
       SET status = ?, completed_at = NOW()
       WHERE id = ? AND status = ?`,
      [OrderStatus.COMPLETED, id, OrderStatus.PAID]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新订单状态为已取消
   */
  static async markAsCancelled(id: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE orders 
       SET status = ?, cancelled_at = NOW()
       WHERE id = ? AND status = ?`,
      [OrderStatus.CANCELLED, id, OrderStatus.PENDING]
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新订单状态为已退款
   */
  static async markAsRefunded(id: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE orders 
       SET status = ?, refunded_at = NOW()
       WHERE id = ? AND status = ?`,
      [OrderStatus.REFUNDED, id, OrderStatus.COMPLETED]
    );

    return result.affectedRows > 0;
  }

  /**
   * 获取用户订单统计
   */
  static async getUserStats(userAddress: string): Promise<{
    total_orders: number;
    total_paid: number;
    total_completed: number;
    total_amount: number;
  }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status IN ('paid', 'completed') THEN 1 ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as total_completed,
        SUM(CASE WHEN status = 'completed' THEN amount_cny ELSE 0 END) as total_amount
       FROM orders 
       WHERE user_address = ?`,
      [userAddress]
    );

    return rows[0] as any;
  }

  /**
   * 格式化订单数据
   */
  private static formatOrder(row: RowDataPacket): Order {
    return {
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }
}

export default OrderModel;
