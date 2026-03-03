import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

interface AGCResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class AGCService {
  private client = axios.create({
    baseURL: config.agcApiUrl,
    headers: {
      'X-API-Key': config.agcApiKey,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  // 获取用户余额
  async getBalance(userId: string): Promise<number> {
    try {
      const response = await this.client.get<AGCResponse<{ balance: number }>>(
        `/users/${userId}/balance`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data.balance;
      }
      
      throw new Error(response.data.error?.message || '获取余额失败');
    } catch (error) {
      logger.error({
        action: 'get_balance_error',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // 如果AGC服务不可用，返回0（保守策略）
      return 0;
    }
  }

  // 获取预扣金额
  async getHoldAmount(userId: string): Promise<number> {
    try {
      const response = await this.client.get<AGCResponse<{ holdAmount: number }>>(
        `/users/${userId}/holds`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data.holdAmount;
      }
      
      return 0;
    } catch (error) {
      logger.error({
        action: 'get_hold_amount_error',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  // 预扣积分
  async holdBalance(userId: string, amount: number, requestId: string): Promise<string> {
    try {
      const response = await this.client.post<AGCResponse<{ holdId: string }>>(
        `/users/${userId}/holds`,
        {
          amount,
          requestId,
          reason: 'compute_gateway_request',
        }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data.holdId;
      }
      
      throw new Error(response.data.error?.message || '预扣积分失败');
    } catch (error) {
      logger.error({
        action: 'hold_balance_error',
        userId,
        amount,
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // 释放预扣积分
  async releaseHold(holdId: string): Promise<void> {
    try {
      await this.client.delete(`/holds/${holdId}`);
    } catch (error) {
      logger.error({
        action: 'release_hold_error',
        holdId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // 释放失败不抛出错误，避免影响主流程
    }
  }

  // 扣除积分
  async deductBalance(userId: string, amount: number, requestId: string): Promise<void> {
    try {
      const response = await this.client.post<AGCResponse<void>>(
        `/users/${userId}/deduct`,
        {
          amount,
          requestId,
          reason: 'compute_gateway_usage',
        }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '扣除积分失败');
      }
      
      logger.info({
        action: 'deduct_balance',
        userId,
        amount,
        requestId,
      });
    } catch (error) {
      logger.error({
        action: 'deduct_balance_error',
        userId,
        amount,
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // 退还积分
  async refundBalance(userId: string, amount: number, requestId: string): Promise<void> {
    try {
      const response = await this.client.post<AGCResponse<void>>(
        `/users/${userId}/refund`,
        {
          amount,
          requestId,
          reason: 'compute_gateway_refund',
        }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '退还积分失败');
      }
      
      logger.info({
        action: 'refund_balance',
        userId,
        amount,
        requestId,
      });
    } catch (error) {
      logger.error({
        action: 'refund_balance_error',
        userId,
        amount,
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // 退款失败不抛出错误
    }
  }
}

export const agcService = new AGCService();