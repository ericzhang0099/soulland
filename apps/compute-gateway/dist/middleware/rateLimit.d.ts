import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
declare const redisClient: Redis;
export declare const rateLimitMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const checkModelRateLimit: (model: string, userId?: string) => Promise<void>;
export { redisClient };
//# sourceMappingURL=rateLimit.d.ts.map