import axios, { AxiosInstance } from 'axios';
import { ProviderConfig } from '../../config';
import { logger } from '../../utils/logger';
import { Provider } from '../providerRouter';

export class AnthropicProvider implements Provider {
  public name: string;
  public type: string;
  public enabled: boolean;
  public priority: number;
  private client: AxiosInstance;

  constructor(config: ProviderConfig) {
    this.name = config.name;
    this.type = config.type;
    this.enabled = config.enabled;
    this.priority = config.priority;

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error({
          provider: this.name,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  async chatCompletions(body: any): Promise<any> {
    // 转换OpenAI格式到Anthropic格式
    const anthropicBody = this.convertToAnthropicFormat(body);
    
    const response = await this.client.post('/v1/messages', anthropicBody);
    
    // 转换回OpenAI格式
    return this.convertToOpenAIFormat(response.data, body.model);
  }

  async streamChatCompletions(body: any): Promise<any> {
    const anthropicBody = this.convertToAnthropicFormat(body);
    anthropicBody.stream = true;
    
    const response = await this.client.post('/v1/messages', anthropicBody, {
      responseType: 'stream',
    });
    
    return this.convertStreamToOpenAIFormat(response.data, body.model);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/v1/models', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  private convertToAnthropicFormat(body: any): any {
    const messages = body.messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    return {
      model: this.mapModel(body.model),
      messages,
      max_tokens: body.max_tokens || 4096,
      temperature: body.temperature,
      top_p: body.top_p,
      stream: body.stream || false,
    };
  }

  private convertToOpenAIFormat(anthropicResponse: any, model: string): any {
    return {
      id: anthropicResponse.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: anthropicResponse.content[0]?.text || '',
        },
        finish_reason: anthropicResponse.stop_reason || 'stop',
      }],
      usage: {
        prompt_tokens: anthropicResponse.usage?.input_tokens || 0,
        completion_tokens: anthropicResponse.usage?.output_tokens || 0,
        total_tokens: (anthropicResponse.usage?.input_tokens || 0) + 
                      (anthropicResponse.usage?.output_tokens || 0),
      },
    };
  }

  private convertStreamToOpenAIFormat(stream: any, model: string): any {
    // 流式响应转换需要更复杂的处理
    // 这里返回原始流，由调用方处理
    return stream;
  }

  private mapModel(model: string): string {
    const modelMap: Record<string, string> = {
      'claude-3-opus': 'claude-3-opus-20240229',
      'claude-3-sonnet': 'claude-3-sonnet-20240229',
      'claude-3-haiku': 'claude-3-haiku-20240307',
    };
    return modelMap[model] || model;
  }
}