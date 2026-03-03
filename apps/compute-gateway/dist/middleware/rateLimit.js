"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.checkModelRateLimit = exports.rateLimitMiddleware = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
const errorHandler_1 = require("./errorHandler");
const logger_1 = require("../utils/logger");
// 创建Redis连接
const redisClient = new ioredis_1.default(config_1.config.redisUrl, {
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
});
exports.redisClient = redisClient;
redisClient.on('error', (err) => {
    logger_1.logger.error('Redis连接错误:', err);
});
// 全局速率限制器
const globalRateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'ratelimit_global',
    points: config_1.config.rateLimit.maxRequests,
    duration: config_1.config.rateLimit.windowMs / 1000,
});
// 用户级速率限制器
const userRateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'ratelimit_user',
    points: config_1.config.rateLimit.maxRequests * 2, // 用户级限制更宽松
    duration: config_1.config.rateLimit.windowMs / 1000,
});
// 模型级速率限制器（防止单个模型被滥用）
const modelRateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'ratelimit_model',
    points: 1000, // 模型级限制
    duration: 60,
});
const rateLimitMiddleware = async (req, res, next) => {
    try {
        // 全局限制检查
        await globalRateLimiter.consume('global', 1);
        // 用户级限制检查
        if (req.user?.userId) {
            try {
                await userRateLimiter.consume(req.user.userId, 1);
            }
            catch (rejRes) {
                if (rejRes instanceof rate_limiter_flexible_1.RateLimiterRes) {
                    res.setHeader('Retry-After', Math.round(rejRes.msBeforeNext / 1000));
                    return next(errorHandler_1.Errors.RATE_LIMIT_EXCEEDED('用户请求频率超限，请稍后再试'));
                }
                throw rejRes;
            }
        }
        // 在响应中设置限制头
        res.setHeader('X-RateLimit-Limit', config_1.config.rateLimit.maxRequests);
        res.setHeader('X-RateLimit-Window', `${config_1.config.rateLimit.windowMs / 1000}s`);
        next();
    }
    catch (rejRes) {
        if (rejRes instanceof rate_limiter_flexible_1.RateLimiterRes) {
            res.setHeader('Retry-After', Math.round(rejRes.msBeforeNext / 1000));
            return next(errorHandler_1.Errors.RATE_LIMIT_EXCEEDED('系统请求频率超限，请稍后再试'));
        }
        next(rejRes);
    }
};
exports.rateLimitMiddleware = rateLimitMiddleware;
// 模型速率限制检查
const checkModelRateLimit = async (model, userId) => {
    try {
        await modelRateLimiter.consume(model, 1);
        if (userId) {
            await modelRateLimiter.consume(`${model}:${userId}`, 1);
        }
    }
    catch (rejRes) {
        if (rejRes instanceof rate_limiter_flexible_1.RateLimiterRes) {
            throw errorHandler_1.Errors.RATE_LIMIT_EXCEEDED(`模型 ${model} 请求频率超限`);
        }
        throw rejRes;
    }
};
exports.checkModelRateLimit = checkModelRateLimit;
//# sourceMappingURL=rateLimit.js.map