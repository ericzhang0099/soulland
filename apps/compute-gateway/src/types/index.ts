/**
 * 算力网关类型定义
 */

// 供应商类型
export type ProviderType = 'openai' | 'anthropic' | 'qwen' | 'glm' | 'deepseek' | 'gpu';

// 模型信息
export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  contextWindow: number;
  inputPrice: number;  // 每1K tokens价格 (AGC积分)
  outputPrice: number; // 每1K tokens价格 (AGC积分)
}

// 消息
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

// 聊天请求
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  user?: string;
  priority?: 'critical' | 'high' | 'normal' | 'low';
}

// Token用量
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// 聊天响应
export interface ChatCompletionResponse {
  id: string;
  model: string;
  content: string;
  usage: TokenUsage;
  cost: number;  // AGC积分消耗
  provider: string;
  latencyMs: number;
  finishReason?: string;
}

// 流式响应块
export interface StreamChunk {
  id: string;
  model: string;
  content: string;
  finishReason?: string;
}

// 供应商配置
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

// 供应商状态
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

// 路由决策
export interface RoutingDecision {
  providerName: string;
  model: string;
  reason: string;
  estimatedLatency: number;
  estimatedCost: number;
  fallbackProviders: string[];
}

// 用户配额
export interface UserQuota {
  userId: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerMinute: number;
  tokensPerDay: number;
  maxCostPerRequest: number;
}

// 用量记录
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

// 熔断器配置
export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  errorRateThreshold: number;
}

// 算力兑换配置
export interface ComputePricing {
  modelId: string;
  inputPrice: number;   // AGC积分 per 1K tokens
  outputPrice: number;  // AGC积分 per 1K tokens
  minimumCost: number;  // 最低消耗
}
