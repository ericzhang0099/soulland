"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageService = void 0;
const rateLimit_1 = require("../middleware/rateLimit");
const logger_1 = require("../utils/logger");
class UsageService {
    USAGE_KEY_PREFIX = 'usage:';
    STATS_KEY_PREFIX = 'usage_stats:';
    // 记录用量
    async recordUsage(record) {
        try {
            const timestamp = new Date().toISOString();
            const recordWithTimestamp = { ...record, timestamp };
            // 存储到Redis列表（最近1000条）
            const key = `${this.USAGE_KEY_PREFIX}${record.userId}`;
            await rateLimit_1.redisClient.lpush(key, JSON.stringify(recordWithTimestamp));
            await rateLimit_1.redisClient.ltrim(key, 0, 999);
            // 更新统计
            await this.updateStats(record);
            logger_1.logger.info({
                action: 'record_usage',
                userId: record.userId,
                requestId: record.requestId,
                cost: record.cost,
            });
        }
        catch (error) {
            logger_1.logger.error({
                action: 'record_usage_error',
                error: error instanceof Error ? error.message : 'Unknown error',
                record,
            });
        }
    }
    // 获取用量记录
    async getUsageRecords(query) {
        try {
            const key = `${this.USAGE_KEY_PREFIX}${query.userId}`;
            const allRecords = await rateLimit_1.redisClient.lrange(key, 0, -1);
            let records = allRecords.map(r => JSON.parse(r));
            // 过滤
            if (query.startDate) {
                const start = new Date(query.startDate);
                records = records.filter(r => new Date(r.timestamp || '') >= start);
            }
            if (query.endDate) {
                const end = new Date(query.endDate);
                records = records.filter(r => new Date(r.timestamp || '') <= end);
            }
            if (query.model) {
                records = records.filter(r => r.model === query.model);
            }
            // 分页
            const total = records.length;
            const start = (query.page - 1) * query.limit;
            const paginatedRecords = records.slice(start, start + query.limit);
            return {
                records: paginatedRecords,
                total,
                page: query.page,
                limit: query.limit,
            };
        }
        catch (error) {
            logger_1.logger.error({
                action: 'get_usage_records_error',
                error: error instanceof Error ? error.message : 'Unknown error',
                query,
            });
            return {
                records: [],
                total: 0,
                page: query.page,
                limit: query.limit,
            };
        }
    }
    // 获取用量统计
    async getUsageStats({ userId, period }) {
        try {
            const key = `${this.STATS_KEY_PREFIX}${userId}:${period}`;
            const stats = await rateLimit_1.redisClient.get(key);
            if (stats) {
                return JSON.parse(stats);
            }
            // 如果没有缓存，计算统计
            const calculatedStats = await this.calculateStats(userId, period);
            // 缓存1小时
            await rateLimit_1.redisClient.setex(key, 3600, JSON.stringify(calculatedStats));
            return calculatedStats;
        }
        catch (error) {
            logger_1.logger.error({
                action: 'get_usage_stats_error',
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                period,
            });
            return {
                totalRequests: 0,
                totalTokens: 0,
                totalCost: 0,
                period,
            };
        }
    }
    // 更新统计
    async updateStats(record) {
        const periods = ['1d', '7d', '30d'];
        for (const period of periods) {
            const key = `${this.STATS_KEY_PREFIX}${record.userId}:${period}`;
            // 使用Redis哈希累加统计
            await rateLimit_1.redisClient.hincrby(key, 'totalRequests', 1);
            await rateLimit_1.redisClient.hincrby(key, 'totalTokens', record.inputTokens + record.outputTokens);
            await rateLimit_1.redisClient.hincrby(key, 'totalCost', record.cost);
            await rateLimit_1.redisClient.hset(key, 'lastUpdated', new Date().toISOString());
            // 设置过期时间
            await rateLimit_1.redisClient.expire(key, 86400 * 30); // 30天
        }
        // 按模型统计
        const modelKey = `${this.STATS_KEY_PREFIX}${record.userId}:model:${record.model}`;
        await rateLimit_1.redisClient.hincrby(modelKey, 'requests', 1);
        await rateLimit_1.redisClient.hincrby(modelKey, 'tokens', record.inputTokens + record.outputTokens);
        await rateLimit_1.redisClient.hincrby(modelKey, 'cost', record.cost);
    }
    // 计算统计
    async calculateStats(userId, period) {
        const key = `${this.STATS_KEY_PREFIX}${userId}:${period}`;
        const stats = await rateLimit_1.redisClient.hgetall(key);
        return {
            totalRequests: parseInt(stats.totalRequests || '0'),
            totalTokens: parseInt(stats.totalTokens || '0'),
            totalCost: parseInt(stats.totalCost || '0'),
            period,
            lastUpdated: stats.lastUpdated,
        };
    }
}
exports.usageService = new UsageService();
//# sourceMappingURL=usageService.js.map