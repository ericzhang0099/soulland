import Redis from 'ioredis';
import { UserQuota, UsageRecord } from '../types';

/**
 * 配额与用量服务
 */
export class QuotaService {
  private redis: Redis;
  private defaultQuota: UserQuota = {
    userId: '',
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    tokensPerMinute: 100000,
    tokensPerDay: 10000000,
    maxCostPerRequest: 100, // 最大100 AGC积分/请求
  };

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  /**
   * 检查用户配额
   */
  async checkQuota(
    userId: string,
    estimatedTokens: number,
    estimatedCost: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    const quota = await this.getUserQuota(userId);

    // 检查单次请求成本限制
    if (estimatedCost > quota.maxCostPerRequest) {
      return { 
        allowed: false, 
        reason: `Request cost ${estimatedCost} exceeds maximum ${quota.maxCostPerRequest}` 
      };
    }

    // 检查RPM
    const rpmKey = `quota:${userId}:rpm`;
    const currentRpm = await this.getCurrentCount(rpmKey, 60);
    if (currentRpm >= quota.requestsPerMinute) {
      return { allowed: false, reason: 'Rate limit exceeded (RPM)' };
    }

    // 检查TPM
    const tpmKey = `quota:${userId}:tpm`;
    const currentTpm = await this.getCurrentCount(tpmKey, 60);
    if (currentTpm + estimatedTokens > quota.tokensPerMinute) {
      return { allowed: false, reason: 'Token limit exceeded (TPM)' };
    }

    // 检查日请求限制
    const rpdKey = `quota:${userId}:rpd:${this.getDayKey()}`;
    const currentRpd = await this.getCurrentCount(rpdKey, 86400);
    if (currentRpd >= quota.requestsPerDay) {
      return { allowed: false, reason: 'Daily request limit exceeded' };
    }

    return { allowed: true };
  }

  /**
   * 记录用量
   */
  async recordUsage(record: UsageRecord): Promise<void> {
    const pipeline = this.redis.pipeline();

    // 增加计数器
    const rpmKey = `quota:${record.userId}:rpm`;
    const tpmKey = `quota:${record.userId}:tpm`;
    const rpdKey = `quota:${record.userId}:rpd:${this.getDayKey()}`;
    const tpdKey = `quota:${record.userId}:tpd:${this.getDayKey()}`;

    pipeline.incr(rpmKey).expire(rpmKey, 60);
    pipeline.incrby(tpmKey, record.totalTokens).expire(tpmKey, 60);
    pipeline.incr(rpdKey).expire(rpdKey, 86400);
    pipeline.incrby(tpdKey, record.totalTokens).expire(tpdKey, 86400);

    // 保存用量记录
    const recordKey = `usage:${record.userId}:${Date.now()}`;
    pipeline.setex(recordKey, 86400 * 7, JSON.stringify(record));

    await pipeline.exec();
  }

  /**
   * 获取用户配额
   */
  async getUserQuota(userId: string): Promise<UserQuota> {
    const quotaKey = `user:quota:${userId}`;
    const data = await this.redis.get(quotaKey);
    
    if (data) {
      return { ...this.defaultQuota, ...JSON.parse(data), userId };
    }

    return { ...this.defaultQuota, userId };
  }

  /**
   * 设置用户配额
   */
  async setUserQuota(userId: string, quota: Partial<UserQuota>): Promise<void> {
    const quotaKey = `user:quota:${userId}`;
    const current = await this.getUserQuota(userId);
    const updated = { ...current, ...quota, userId };
    await this.redis.set(quotaKey, JSON.stringify(updated));
  }

  /**
   * 获取用量统计
   */
  async getUsageStats(userId: string): Promise<{
    today: { requests: number; tokens: number };
    total: { requests: number; tokens: number; cost: number };
  }> {
    const rpdKey = `quota:${userId}:rpd:${this.getDayKey()}`;
    const tpdKey = `quota:${userId}:tpd:${this.getDayKey()}`;

    const [todayRequests, todayTokens] = await Promise.all([
      this.redis.get(rpdKey).then(v => parseInt(v || '0')),
      this.redis.get(tpdKey).then(v => parseInt(v || '0')),
    ]);

    // 获取历史记录
    const pattern = `usage:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    let totalRequests = 0;
    let totalTokens = 0;
    let totalCost = 0;

    if (keys.length > 0) {
      const records = await this.redis.mget(...keys);
      records.forEach(record => {
        if (record) {
          const data: UsageRecord = JSON.parse(record);
          totalRequests++;
          totalTokens += data.totalTokens;
          totalCost += data.cost;
        }
      });
    }

    return {
      today: { requests: todayRequests, tokens: todayTokens },
      total: { requests: totalRequests, tokens: totalTokens, cost: totalCost },
    };
  }

  /**
   * 获取当前计数
   */
  private async getCurrentCount(key: string, windowSeconds: number): Promise<number> {
    const count = await this.redis.get(key);
    return parseInt(count || '0');
  }

  /**
   * 获取日期键
   */
  private getDayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}
