import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ProviderConfig,
  ProviderStatus,
  ChatCompletionRequest,
  ChatCompletionResponse,
  TokenUsage,
  StreamChunk,
  ProviderType
} from '../types';

/**
 * 供应商适配器基类
 */
export abstract class BaseAdapter {
  protected config: ProviderConfig;
  protected client: AxiosInstance;
  public status: ProviderStatus;
  private requestCount = 0;
  private errorCount = 0;
  private results: boolean[] = [];

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout * 1000,
      headers: this.getHeaders(),
    });
    
    this.status = {
      name: config.name,
      type: config.type,
      isAvailable: true,
      latencyMs: 0,
      errorRate: 0,
      currentLoad: 0,
      queueLength: 0,
      lastCheck: new Date(),
      circuitState: 'closed',
    };
  }

  protected abstract getHeaders(): Record<string, string>;
  protected abstract convertRequest(request: ChatCompletionRequest): any;
  protected abstract convertResponse(response: any, requestId: string): ChatCompletionResponse;
  protected abstract convertStreamChunk(chunk: any): StreamChunk | null;
  protected abstract getModelPricing(model: string): { input: number; output: number };

  /**
   * 非流式聊天完成
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const startTime = Date.now();
    
    try {
      const payload = this.convertRequest(request);
      const response = await this.client.post('/chat/completions', payload);
      
      const latency = Date.now() - startTime;
      const result = this.convertResponse(response.data, request.user || 'anonymous');
      result.latencyMs = latency;
      result.provider = this.config.name;
      
      await this.updateStatus(true, latency);
      return result;
    } catch (error) {
      await this.updateStatus(false);
      throw new AdapterError(`${this.config.name} request failed: ${error}`);
    }
  }

  /**
   * 流式聊天完成
   */
  async *chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<StreamChunk> {
    const payload = this.convertRequest(request);
    payload.stream = true;

    try {
      const response = await this.client.post('/chat/completions', payload, {
        responseType: 'stream',
      });

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter((line: string) => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const streamChunk = this.convertStreamChunk(parsed);
              if (streamChunk) yield streamChunk;
            } catch {
              continue;
            }
          }
        }
      }
      
      await this.updateStatus(true, 0);
    } catch (error) {
      await this.updateStatus(false);
      throw new AdapterError(`${this.config.name} stream request failed: ${error}`);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/models', { timeout: 5000 });
      const isHealthy = response.status === 200;
      this.status.isAvailable = isHealthy;
      this.status.lastCheck = new Date();
      return isHealthy;
    } catch {
      this.status.isAvailable = false;
      this.status.lastCheck = new Date();
      return false;
    }
  }

  /**
   * 更新状态
   */
  private async updateStatus(success: boolean, latency: number = 0): Promise<void> {
    this.requestCount++;
    if (!success) this.errorCount++;
    
    // 滑动窗口错误率
    this.results.push(success);
    if (this.results.length > 100) this.results.shift();
    this.status.errorRate = this.results.filter(r => !r).length / this.results.length;
    
    // 更新延迟（指数移动平均）
    if (latency > 0) {
      const alpha = 0.3;
      this.status.latencyMs = this.status.latencyMs 
        ? alpha * latency + (1 - alpha) * this.status.latencyMs 
        : latency;
    }
    
    this.status.lastCheck = new Date();
  }

  /**
   * 计算成本
   */
  calculateCost(model: string, usage: TokenUsage): number {
    const pricing = this.getModelPricing(model);
    const inputCost = (usage.promptTokens / 1000) * pricing.input;
    const outputCost = (usage.completionTokens / 1000) * pricing.output;
    return (inputCost + outputCost) * this.config.costMultiplier;
  }

  get isAvailable(): boolean {
    return this.status.isAvailable && this.config.enabled;
  }
}

/**
 * 适配器错误
 */
export class AdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdapterError';
  }
}
