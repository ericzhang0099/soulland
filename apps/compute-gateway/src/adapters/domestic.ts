import { BaseAdapter } from './base';
import { ProviderConfig, ChatCompletionRequest, ChatCompletionResponse, StreamChunk, ProviderType } from '../types';

/**
 * 国产大模型适配器 - 通义千问/GLM/DeepSeek
 */
export class DomesticAdapter extends BaseAdapter {
  private vendor: string;

  constructor(config: ProviderConfig, vendor: string = 'qwen') {
    super(config);
    this.vendor = vendor;
    this.config.type = vendor as ProviderType;
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.vendor === 'qwen') {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    } else if (this.vendor === 'glm') {
      headers['Authorization'] = this.config.apiKey;
    } else {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  protected convertRequest(request: ChatCompletionRequest): any {
    // 大多数国产模型兼容OpenAI格式
    return {
      model: request.model,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
      stream: request.stream ?? false,
    };
  }

  protected convertResponse(response: any, requestId: string): ChatCompletionResponse {
    // 兼容OpenAI格式
    if (response.choices) {
      const choice = response.choices[0];
      const usage = response.usage;

      return {
        id: response.id || requestId,
        model: response.model || this.config.models[0],
        content: choice?.message?.content || '',
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
        cost: 0,
        provider: this.config.name,
        latencyMs: 0,
        finishReason: choice?.finish_reason,
      };
    }

    // 兼容其他格式
    return {
      id: response.id || requestId,
      model: this.config.models[0],
      content: response.result || response.output?.text || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      cost: 0,
      provider: this.config.name,
      latencyMs: 0,
    };
  }

  protected convertStreamChunk(chunk: any): StreamChunk | null {
    if (chunk.choices) {
      const delta = chunk.choices[0]?.delta;
      return {
        id: chunk.id,
        model: chunk.model,
        content: delta?.content || '',
      };
    }
    return null;
  }

  protected getModelPricing(model: string): { input: number; output: number } {
    // AGC积分定价 (国产模型更便宜)
    const pricing: Record<string, { input: number; output: number }> = {
      // 通义千问
      'qwen-turbo': { input: 0.2, output: 0.6 },
      'qwen-plus': { input: 0.4, output: 1.2 },
      'qwen-max': { input: 4, output: 12 },
      // 智谱GLM
      'glm-4': { input: 1, output: 1 },
      'glm-4-flash': { input: 0.1, output: 0.1 },
      // DeepSeek
      'deepseek-chat': { input: 0.1, output: 0.2 },
      'deepseek-coder': { input: 0.1, output: 0.2 },
    };
    return pricing[model] || { input: 1, output: 1 };
  }
}
