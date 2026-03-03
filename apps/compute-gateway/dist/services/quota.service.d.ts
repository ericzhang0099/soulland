import { UserQuota, UsageRecord } from '../types';
/**
 * 配额与用量服务
 */
export declare class QuotaService {
    private redis;
    private defaultQuota;
    constructor(redisUrl: string);
    /**
     * 检查用户配额
     */
    checkQuota(userId: string, estimatedTokens: number, estimatedCost: number): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    /**
     * 记录用量
     */
    recordUsage(record: UsageRecord): Promise<void>;
    /**
     * 获取用户配额
     */
    getUserQuota(userId: string): Promise<UserQuota>;
    /**
     * 设置用户配额
     */
    setUserQuota(userId: string, quota: Partial<UserQuota>): Promise<void>;
    /**
     * 获取用量统计
     */
    getUsageStats(userId: string): Promise<{
        today: {
            requests: number;
            tokens: number;
        };
        total: {
            requests: number;
            tokens: number;
            cost: number;
        };
    }>;
    /**
     * 获取当前计数
     */
    private getCurrentCount;
    /**
     * 获取日期键
     */
    private getDayKey;
    /**
     * 关闭连接
     */
    close(): Promise<void>;
}
//# sourceMappingURL=quota.service.d.ts.map