/**
 * 算力网关类型定义
 */
export type ProviderType = 'openai' | 'anthropic' | 'qwen' | 'glm' | 'deepseek' | 'gpu';
export interface ModelInfo {
    id: string;
    name: string;
    provider: ProviderType;
    maxTokens: number;
    supportsStreaming: boolean;
    supportsVision: boolean;
    contextWindow: number;
    inputPrice: number;
    outputPrice: number;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
}
export interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    user?: string;
    priority?: 'critical' | 'high' | 'normal' | 'low';
}
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
export interface ChatCompletionResponse {
    id: string;
    model: string;
    content: string;
    usage: TokenUsage;
    cost: number;
    provider: string;
    latencyMs: number;
    finishReason?: string;
}
export interface StreamChunk {
    id: string;
    model: string;
    content: string;
    finishReason?: string;
}
export interface ProviderConfig {
    name: string;
    type: ProviderType;
    baseUrl: string;
    apiKey: string;
    models: string[];
    weight: number;
    maxRpm: number;
    maxTpm: number;
    timeout: number;
    retryAttempts: number;
    enabled: boolean;
    costMultiplier: number;
}
export interface ProviderStatus {
    name: string;
    type: ProviderType;
    isAvailable: boolean;
    latencyMs: number;
    errorRate: number;
    currentLoad: number;
    queueLength: number;
    lastCheck: Date;
    circuitState: 'closed' | 'open' | 'half-open';
}
export interface RoutingDecision {
    providerName: string;
    model: string;
    reason: string;
    estimatedLatency: number;
    estimatedCost: number;
    fallbackProviders: string[];
}
export interface UserQuota {
    userId: string;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    tokensPerMinute: number;
    tokensPerDay: number;
    maxCostPerRequest: number;
}
export interface UsageRecord {
    requestId: string;
    userId: string;
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    latencyMs: number;
    timestamp: Date;
    success: boolean;
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    errorRateThreshold: number;
}
export interface ComputePricing {
    modelId: string;
    inputPrice: number;
    outputPrice: number;
    minimumCost: number;
}
//# sourceMappingURL=index.d.ts.map