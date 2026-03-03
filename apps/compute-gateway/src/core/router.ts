import { 
  BaseAdapter, 
  OpenAIAdapter, 
  AnthropicAdapter, 
  DomesticAdapter, 
  GPUAdapter 
} from '../adapters';
import { LoadBalancer } from './load-balancer';
import { CircuitBreakerManager, CircuitBreakerConfig } from './circuit-breaker';
import { 
  ChatCompletionRequest, 
  ChatCompletionResponse, 
  StreamChunk,
  ProviderConfig,
  RoutingDecision 
} from '../types';

/**
 * 智能路由器
 */
export class Router {
  private adapters = new Map<string, BaseAdapter>();
  private configs = new Map<string, ProviderConfig>();
  private loadBalancer = new LoadBalancer();
  private circuitManager = new CircuitBreakerManager();
  private healthCheckInterval?: NodeJS.Timeout;

  /**
   * 注册供应商
   */
  registerProvider(config: ProviderConfig): void {
    console.log(`Registering provider: ${config.name} (${config.type})`);

    let adapter: BaseAdapter;

    switch (config.type) {
      case 'openai':
        adapter = new OpenAIAdapter(config);
        break;
      case 'anthropic':
        adapter = new AnthropicAdapter(config);
        break;
      case 'qwen':
      case 'glm':
      case 'deepseek':
        adapter = new DomesticAdapter(config, config.type);
        break;
      case 'gpu':
        adapter = new GPUAdapter(config);
        break;
      default:
        throw new Error(`Unknown provider type: ${config.type}`);
    }

    this.adapters.set(config.name, adapter);
    this.configs.set(config.name, config);

    // 注册熔断器
    this.circuitManager.getBreaker(config.name, {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60,
      errorRateThreshold: 0.5,
      halfOpenMaxCalls: 3,
    });
  }

  /**
   * 路由请求
   */
  async route(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const startTime = Date.now();

    // 获取决策
    const decision = this.makeRoutingDecision(request);
    if (!decision) {
      throw new RouterError('No available providers');
    }

    console.log(`Routing request to ${decision.providerName}`);

    // 尝试主供应商和备选
    const providersToTry = [decision.providerName, ...decision.fallbackProviders];
    let lastError: Error | null = null;

    for (const providerName of providersToTry) {
      const adapter = this.adapters.get(providerName);
      if (!adapter) continue;

      const breaker = this.circuitManager.getBreaker(providerName);

      try {
        const response = await breaker.call(() => adapter.chatCompletion(request));
        response.latencyMs = Date.now() - startTime;
        
        // 计算成本
        response.cost = adapter.calculateCost(response.model, response.usage);
        
        console.log(`Request succeeded on ${providerName}`);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Provider ${providerName} failed: ${error}`);
      }
    }

    throw lastError || new RouterError('All providers failed');
  }

  /**
   * 流式路由
   */
  async *routeStream(request: ChatCompletionRequest): AsyncGenerator<StreamChunk> {
    const decision = this.makeRoutingDecision(request);
    if (!decision) {
      throw new RouterError('No available providers');
    }

    const adapter = this.adapters.get(decision.providerName);
    if (!adapter) {
      throw new RouterError(`Adapter not found: ${decision.providerName}`);
    }

    const breaker = this.circuitManager.getBreaker(decision.providerName);

    try {
      yield* breaker.call(() => adapter.chatCompletionStream(request));
    } catch (error) {
      console.error(`Stream failed on ${decision.providerName}:`, error);
      
      // 尝试备选
      for (const fallback of decision.fallbackProviders) {
        const fallbackAdapter = this.adapters.get(fallback);
        if (fallbackAdapter) {
          try {
            console.log(`Falling back to ${fallback}`);
            yield* fallbackAdapter.chatCompletionStream(request);
            return;
          } catch {
            continue;
          }
        }
      }
      throw error;
    }
  }

  /**
   * 做出路由决策
   */
  private makeRoutingDecision(request: ChatCompletionRequest): RoutingDecision | null {
    const statuses = new Map<string, any>();
    
    this.adapters.forEach((adapter, name) => {
      statuses.set(name, adapter.status);
    });

    return this.loadBalancer.selectProvider(request, statuses, this.configs);
  }

  /**
   * 启动健康检查
   */
  startHealthChecks(intervalMs: number = 30000): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkAllProviders();
    }, intervalMs);
  }

  /**
   * 停止健康检查
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * 检查所有供应商
   */
  private async checkAllProviders(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    this.adapters.forEach((adapter, name) => {
      promises.push(this.checkProvider(name, adapter));
    });

    await Promise.all(promises);
  }

  /**
   * 检查单个供应商
   */
  private async checkProvider(name: string, adapter: BaseAdapter): Promise<void> {
    try {
      const isHealthy = await adapter.healthCheck();
      adapter.status.isAvailable = isHealthy;
      adapter.status.lastCheck = new Date();
    } catch (error) {
      adapter.status.isAvailable = false;
      adapter.status.lastCheck = new Date();
    }
  }

  /**
   * 获取供应商状态
   */
  getProviderStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    this.adapters.forEach((adapter, name) => {
      status[name] = {
        available: adapter.status.isAvailable,
        latencyMs: adapter.status.latencyMs,
        errorRate: adapter.status.errorRate,
        load: adapter.status.currentLoad,
        circuitState: adapter.status.circuitState,
      };
    });

    return status;
  }

  /**
   * 获取所有适配器
   */
  getAdapters(): Map<string, BaseAdapter> {
    return this.adapters;
  }

  /**
   * 关闭
   */
  async close(): Promise<void> {
    this.stopHealthChecks();
  }
}

/**
 * 路由错误
 */
export class RouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RouterError';
  }
}
