import { BaseAdapter } from '../adapters';
import { ChatCompletionRequest, ChatCompletionResponse, StreamChunk, ProviderConfig } from '../types';
/**
 * 智能路由器
 */
export declare class Router {
    private adapters;
    private configs;
    private loadBalancer;
    private circuitManager;
    private healthCheckInterval?;
    /**
     * 注册供应商
     */
    registerProvider(config: ProviderConfig): void;
    /**
     * 路由请求
     */
    route(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    /**
     * 流式路由
     */
    routeStream(request: ChatCompletionRequest): AsyncGenerator<StreamChunk>;
    /**
     * 做出路由决策
     */
    private makeRoutingDecision;
    /**
     * 启动健康检查
     */
    startHealthChecks(intervalMs?: number): void;
    /**
     * 停止健康检查
     */
    stopHealthChecks(): void;
    /**
     * 检查所有供应商
     */
    private checkAllProviders;
    /**
     * 检查单个供应商
     */
    private checkProvider;
    /**
     * 获取供应商状态
     */
    getProviderStatus(): Record<string, any>;
    /**
     * 获取所有适配器
     */
    getAdapters(): Map<string, BaseAdapter>;
    /**
     * 关闭
     */
    close(): Promise<void>;
}
/**
 * 路由错误
 */
export declare class RouterError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=router.d.ts.map