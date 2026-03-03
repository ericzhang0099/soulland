import { BaseAdapter } from './base';
import { ProviderConfig, ChatCompletionRequest, ChatCompletionResponse, StreamChunk, ProviderType } from '../types';

/**
 * Anthropic Claude 适配器
 */
export class AnthropicAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super(config);
    this.config.type = 'anthropic' as ProviderType;
  }

  protected getHeaders(): Record<string, string> {
    return {
      'x-api-key': this.config.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    };
  }

  protected convertRequest(request: ChatCompletionRequest): any {
    // 分离system消息
    const systemMessage = request.messages.find(m => m.role === 'system');
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    const payload: any = {
      model: request.model,
      messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0.7,
      stream: request.stream ?? false,
    };

    if (systemMessage) {
      payload.system = systemMessage.content;
    }

    return payload;
  }

  protected convertResponse(response: any, requestId: string): ChatCompletionResponse {
    const content = response.content
      ?.filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('') || '';

    const usage = response.usage;

    return {
      id: response.id,
      model: response.model,
      content,
      usage: {
        promptTokens: usage?.input_tokens || 0,
        completionTokens: usage?.output_tokens || 0,
        totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
      },
      cost: 0,
      provider: this.config.name,
      latencyMs: 0,
      finishReason: response.stop_reason,
    };
  }

  protected convertStreamChunk(chunk: any): StreamChunk | null {
    if (chunk.type === 'content_block_delta') {
      return {
        id: chunk.index?.toString() || '',
        model: '',
        content: chunk.delta?.text || '',
      };
    }
    return null;
  }

  protected getModelPricing(model: string): { input: number; output: number } {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-opus-20240229': { input: 15, output: 75 },
      'claude-3-sonnet-20240229': { input: 3, output: 15 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    };
    return pricing[model] || { input: 3, output: 15 };
  }
}
