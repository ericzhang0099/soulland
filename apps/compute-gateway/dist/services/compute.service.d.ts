import { Router } from '../core/router';
import { PointsService } from './points.service';
import { QuotaService } from './quota.service';
import { ChatCompletionRequest, ChatCompletionResponse, StreamChunk } from '../types';
/**
 * 算力服务 - 核心业务逻辑
 */
export declare class ComputeService {
    private router;
    private pointsService;
    private quotaService;
    constructor(router: Router, pointsService: PointsService, quotaService: QuotaService);
    /**
     * 聊天完成
     */
    chatCompletion(request: ChatCompletionRequest, userAddress: string): Promise<ChatCompletionResponse>;
    /**
     * 流式聊天完成
     */
    chatCompletionStream(request: ChatCompletionRequest, userAddress: string): AsyncGenerator<StreamChunk>;
    /**
     * 获取可用模型
     */
    getAvailableModels(): Array<{
        id: string;
        provider: string;
        inputPrice: number;
        outputPrice: number;
    }>;
    /**
     * 获取用户统计
     */
    getUserStats(userAddress: string): Promise<{
        balance: string;
        balanceRaw: string;
        usage: {
            today: {
                requests: number;
                tokens: number;
            };
            total: {
                requests: number;
                tokens: number;
                cost: number;
            };
        };
    }>;
    /**
     * 估算token数
     */
    private estimateTokens;
    /**
     * 估算成本
     */
    private estimateCost;
}
/**
 * 算力错误
 */
export declare class ComputeError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=compute.service.d.ts.map