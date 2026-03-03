import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// 支付宝通知接口
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

// 创建通知参数
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
export class AlipayNotificationModel {
  /**
   * 创建通知记录
   */
  static async create(params: CreateNotificationParams): Promise<AlipayNotification> {
    const {
      notify_id,
      notify_type,
      out_trade_no,
      trade_no,
      trade_status,
      total_amount,
      buyer_id,
      buyer_logon_id,
      notify_data,
      verified,
    } = params;

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO alipay_notifications 
       (notify_id, notify_type, out_trade_no, trade_no, trade_status, total_amount, 
        buyer_id, buyer_logon_id, notify_data, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    return this.findById(result.insertId) as Promise<AlipayNotification>;
  }

  /**
   * 根据ID查找通知
   */
  static async findById(id: number): Promise<AlipayNotification | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM alipay_notifications WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;
    return this.formatNotification(rows[0]);
  }

  /**
   * 根据通知ID查找
   */
  static async findByNotifyId(notifyId: string): Promise<AlipayNotification | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM alipay_notifications WHERE notify_id = ?',
      [notifyId]
    );

    if (rows.length === 0) return null;
    return this.formatNotification(rows[0]);
  }

  /**
   * 根据商户订单号查找通知
   */
  static async findByOutTradeNo(outTradeNo: string): Promise<AlipayNotification[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM alipay_notifications WHERE out_trade_no = ? ORDER BY created_at DESC',
      [outTradeNo]
    );

    return rows.map(row => this.formatNotification(row));
  }

  /**
   * 查找未处理的通知
   */
  static async findUnprocessed(limit: number = 100): Promise<AlipayNotification[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM alipay_notifications WHERE processed = false ORDER BY created_at ASC LIMIT ?',
      [limit]
    );

    return rows.map(row => this.formatNotification(row));
  }

  /**
   * 标记通知为已处理
   */
  static async markAsProcessed(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE alipay_notifications SET processed = true, processed_at = NOW() WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  /**
   * 检查通知是否已存在
   */
  static async exists(notifyId: string): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT 1 FROM alipay_notifications WHERE notify_id = ?',
      [notifyId]
    );

    return rows.length > 0;
  }

  /**
   * 格式化通知数据
   */
  private static formatNotification(row: RowDataPacket): AlipayNotification {
    return {
      ...row,
      notify_data: row.notify_data ? JSON.parse(row.notify_data) : null,
    };
  }
}

export default AlipayNotificationModel;
