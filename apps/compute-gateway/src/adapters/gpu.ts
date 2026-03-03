import { BaseAdapter } from './base';
import { ProviderConfig, ChatCompletionRequest, ChatCompletionResponse, StreamChunk, ProviderType } from '../types';

/**
 * GPU推理服务适配器 (vLLM/TGI)
 */
export class GPUAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super(config);
    this.config.type = 'gpu' as ProviderType;
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  protected convertRequest(request: ChatCompletionRequest): any {
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
    // vLLM兼容OpenAI格式
    const choice = response.choices?.[0];
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
    // GPU推理成本更低
    return { input: 0.05, output: 0.1 };
  }

  /**
   * 获取GPU状态
   */
  async getGPUStatus(): Promise<any> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'error', error: String(error) };
    }
  }
}
