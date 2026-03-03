import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { config } from '../config';
import { Errors } from './errorHandler';
import { logger } from '../utils/logger';

// 创建Redis连接
const redisClient = new Redis(config.redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redisClient.on('error', (err) => {
  logger.error('Redis连接错误:', err);
});

// 全局速率限制器
const globalRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ratelimit_global',
  points: config.rateLimit.maxRequests,
  duration: config.rateLimit.windowMs / 1000,
});

// 用户级速率限制器
const userRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ratelimit_user',
  points: config.rateLimit.maxRequests * 2, // 用户级限制更宽松
  duration: config.rateLimit.windowMs / 1000,
});

// 模型级速率限制器（防止单个模型被滥用）
const modelRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ratelimit_model',
  points: 1000, // 模型级限制
  duration: 60,
});

export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 全局限制检查
    await globalRateLimiter.consume('global', 1);
    
    // 用户级限制检查
    if (req.user?.userId) {
      try {
        await userRateLimiter.consume(req.user.userId, 1);
      } catch (rejRes) {
        if (rejRes instanceof RateLimiterRes) {
          res.setHeader('Retry-After', Math.round(rejRes.msBeforeNext / 1000));
          return next(Errors.RATE_LIMIT_EXCEEDED('用户请求频率超限，请稍后再试'));
        }
        throw rejRes;
      }
    }

    // 在响应中设置限制头
    res.setHeader('X-RateLimit-Limit', config.rateLimit.maxRequests);
    res.setHeader('X-RateLimit-Window', `${config.rateLimit.windowMs / 1000}s`);

    next();
  } catch (rejRes) {
    if (rejRes instanceof RateLimiterRes) {
      res.setHeader('Retry-After', Math.round(rejRes.msBeforeNext / 1000));
      return next(Errors.RATE_LIMIT_EXCEEDED('系统请求频率超限，请稍后再试'));
    }
    next(rejRes);
  }
};

// 模型速率限制检查
export const checkModelRateLimit = async (
  model: string,
  userId?: string
): Promise<void> => {
  try {
    await modelRateLimiter.consume(model, 1);
    if (userId) {
      await modelRateLimiter.consume(`${model}:${userId}`, 1);
    }
  } catch (rejRes) {
    if (rejRes instanceof RateLimiterRes) {
      throw Errors.RATE_LIMIT_EXCEEDED(`模型 ${model} 请求频率超限`);
    }
    throw rejRes;
  }
};

export { redisClient };