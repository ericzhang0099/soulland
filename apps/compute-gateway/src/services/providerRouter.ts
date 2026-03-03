import { config, MODEL_PROVIDER_MAP } from '../config';
import { OpenAIProvider } from './providers/openaiProvider';
import { AnthropicProvider } from './providers/anthropicProvider';
import { AliyunProvider } from './providers/aliyunProvider';
import { ZhipuProvider } from './providers/zhipuProvider';
import { logger } from '../utils/logger';

export interface Provider {
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  chatCompletions(body: any): Promise<any>;
  streamChatCompletions(body: any): Promise<any>;
  healthCheck(): Promise<boolean>;
}

class ProviderRouter {
  private providers: Map<string, Provider> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    for (const providerConfig of config.providers) {
      let provider: Provider;

      switch (providerConfig.type) {
        case 'openai':
          provider = new OpenAIProvider(providerConfig);
          break;
        case 'anthropic':
          provider = new AnthropicProvider(providerConfig);
          break;
        case 'aliyun':
          provider = new AliyunProvider(providerConfig);
          break;
        case 'zhipu':
          provider = new ZhipuProvider(providerConfig);
          break;
        default:
          logger.warn(`未知的供应商类型: ${providerConfig.type}`);
          continue;
      }

      this.providers.set(providerConfig.name, provider);
      this.circuitBreakers.set(
        providerConfig.name,
        new CircuitBreaker(providerConfig.name, config.circuitBreaker)
      );

      logger.info(`供应商已初始化: ${providerConfig.name}`);
    }
  }

  // 选择最佳供应商
  selectProvider(model: string): Provider | null {
    const supportedProviders = MODEL_PROVIDER_MAP[model];
    
    if (!supportedProviders) {
      logger.warn(`模型 ${model} 没有配置对应的供应商`);
      return null;
    }

    // 按优先级排序，选择可用的供应商
    const candidates: Provider[] = [];
    
    for (const providerName of supportedProviders) {
      const provider = this.providers.get(providerName);
      const breaker = this.circuitBreakers.get(providerName);
      
      if (provider?.enabled && breaker?.canExecute()) {
        candidates.push(provider);
      }
    }

    // 按优先级排序
    candidates.sort((a, b) => a.priority - b.priority);

    if (candidates.length === 0) {
      logger.warn(`模型 ${model} 没有可用的供应商`);
      return null;
    }

    return candidates[0];
  }

  // 获取所有可用供应商
  getAvailableProviders(): Provider[] {
    const available: Provider[] = [];
    
    for (const [name, provider] of this.providers) {
      const breaker = this.circuitBreakers.get(name);
      if (provider.enabled && breaker?.canExecute()) {
        available.push(provider);
      }
    }
    
    return available;
  }

  // 记录成功
  recordSuccess(providerName: string) {
    const breaker = this.circuitBreakers.get(providerName);
    breaker?.recordSuccess();
  }

  // 记录失败
  recordFailure(providerName: string) {
    const breaker = this.circuitBreakers.get(providerName);
    breaker?.recordFailure();
  }

  // 获取熔断器状态
  getCircuitBreakerStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [name, breaker] of this.circuitBreakers) {
      status[name] = breaker.getStatus();
    }
    
    return status;
  }
}

// 熔断器实现
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private config: { failureThreshold: number; resetTimeout: number; halfOpenRequests: number };
  private name: string;

  constructor(name: string, config: { failureThreshold: number; resetTimeout: number; halfOpenRequests: number }) {
    this.name = name;
    this.config = config;
  }

  canExecute(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      const now = Date.now();
      if (this.lastFailureTime && now - this.lastFailureTime >= this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        this.failureCount = 0;
        logger.info(`熔断器 ${this.name} 进入半开状态`);
        return true;
      }
      return false;
    }

    // HALF_OPEN状态
    return this.successCount + this.failureCount < this.config.halfOpenRequests;
  }

  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.config.halfOpenRequests) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        logger.info(`熔断器 ${this.name} 关闭`);
      }
    } else {
      this.failureCount = 0;
    }
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      logger.warn(`熔断器 ${this.name} 打开（半开状态失败）`);
    } else if (this.state === 'CLOSED' && this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      logger.warn(`熔断器 ${this.name} 打开（失败次数: ${this.failureCount}）`);
    }
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
    };
  }
}

export const providerRouter = new ProviderRouter();