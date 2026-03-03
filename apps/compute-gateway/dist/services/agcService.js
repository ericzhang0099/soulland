"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agcService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class AGCService {
    client = axios_1.default.create({
        baseURL: config_1.config.agcApiUrl,
        headers: {
            'X-API-Key': config_1.config.agcApiKey,
            'Content-Type': 'application/json',
        },
        timeout: 10000,
    });
    // 获取用户余额
    async getBalance(userId) {
        try {
            const response = await this.client.get(`/users/${userId}/balance`);
            if (response.data.success && response.data.data) {
                return response.data.data.balance;
            }
            throw new Error(response.data.error?.message || '获取余额失败');
        }
        catch (error) {
            logger_1.logger.error({
                action: 'get_balance_error',
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            // 如果AGC服务不可用，返回0（保守策略）
            return 0;
        }
    }
    // 获取预扣金额
    async getHoldAmount(userId) {
        try {
            const response = await this.client.get(`/users/${userId}/holds`);
            if (response.data.success && response.data.data) {
                return response.data.data.holdAmount;
            }
            return 0;
        }
        catch (error) {
            logger_1.logger.error({
                action: 'get_hold_amount_error',
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    // 预扣积分
    async holdBalance(userId, amount, requestId) {
        try {
            const response = await this.client.post(`/users/${userId}/holds`, {
                amount,
                requestId,
                reason: 'compute_gateway_request',
            });
            if (response.data.success && response.data.data) {
                return response.data.data.holdId;
            }
            throw new Error(response.data.error?.message || '预扣积分失败');
        }
        catch (error) {
            logger_1.logger.error({
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
    async releaseHold(holdId) {
        try {
            await this.client.delete(`/holds/${holdId}`);
        }
        catch (error) {
            logger_1.logger.error({
                action: 'release_hold_error',
                holdId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            // 释放失败不抛出错误，避免影响主流程
        }
    }
    // 扣除积分
    async deductBalance(userId, amount, requestId) {
        try {
            const response = await this.client.post(`/users/${userId}/deduct`, {
                amount,
                requestId,
                reason: 'compute_gateway_usage',
            });
            if (!response.data.success) {
                throw new Error(response.data.error?.message || '扣除积分失败');
            }
            logger_1.logger.info({
                action: 'deduct_balance',
                userId,
                amount,
                requestId,
            });
        }
        catch (error) {
            logger_1.logger.error({
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
    async refundBalance(userId, amount, requestId) {
        try {
            const response = await this.client.post(`/users/${userId}/refund`, {
                amount,
                requestId,
                reason: 'compute_gateway_refund',
            });
            if (!response.data.success) {
                throw new Error(response.data.error?.message || '退还积分失败');
            }
            logger_1.logger.info({
                action: 'refund_balance',
                userId,
                amount,
                requestId,
            });
        }
        catch (error) {
            logger_1.logger.error({
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
exports.agcService = new AGCService();
//# sourceMappingURL=agcService.js.map