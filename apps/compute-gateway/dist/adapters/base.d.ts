import { AxiosInstance } from 'axios';
import { ProviderConfig, ProviderStatus, ChatCompletionRequest, ChatCompletionResponse, TokenUsage, StreamChunk } from '../types';
/**
 * 供应商适配器基类
 */
export declare abstract class BaseAdapter {
    protected config: ProviderConfig;
    protected client: AxiosInstance;
    status: ProviderStatus;
    private requestCount;
    private errorCount;
    private results;
    constructor(config: ProviderConfig);
    protected abstract getHeaders(): Record<string, string>;
    protected abstract convertRequest(request: ChatCompletionRequest): any;
    protected abstract convertResponse(response: any, requestId: string): ChatCompletionResponse;
    protected abstract convertStreamChunk(chunk: any): StreamChunk | null;
    protected abstract getModelPricing(model: string): {
        input: number;
        output: number;
    };
    /**
     * 非流式聊天完成
     */
    chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    /**
     * 流式聊天完成
     */
    chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<StreamChunk>;
    /**
     * 健康检查
     */
    healthCheck(): Promise<boolean>;
    /**
     * 更新状态
     */
    private updateStatus;
    /**
     * 计算成本
     */
    calculateCost(model: string, usage: TokenUsage): number;
    get isAvailable(): boolean;
}
/**
 * 适配器错误
 */
export declare class AdapterError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=base.d.ts.map