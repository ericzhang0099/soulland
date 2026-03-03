interface UsageRecord {
    userId: string;
    requestId: string;
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    duration: number;
    status: 'success' | 'failed';
    timestamp?: string;
}
interface UsageQuery {
    userId: string;
    startDate?: string;
    endDate?: string;
    model?: string;
    page: number;
    limit: number;
}
declare class UsageService {
    private readonly USAGE_KEY_PREFIX;
    private readonly STATS_KEY_PREFIX;
    recordUsage(record: UsageRecord): Promise<void>;
    getUsageRecords(query: UsageQuery): Promise<{
        records: UsageRecord[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUsageStats({ userId, period }: {
        userId: string;
        period: string;
    }): Promise<any>;
    private updateStats;
    private calculateStats;
}
export declare const usageService: UsageService;
export {};
//# sourceMappingURL=usageService.d.ts.map