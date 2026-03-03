import axios, { AxiosInstance } from 'axios';
import { ProviderConfig } from '../../config';
import { logger } from '../../utils/logger';
import { Provider } from '../providerRouter';

export class AliyunProvider implements Provider {
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
        'Authorization': `Bearer ${config.apiKey}`,
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
    const aliyunBody = this.convertToAliyunFormat(body);
    
    const response = await this.client.post('/services/aigc/text-generation/generation', aliyunBody);
    
    return this.convertToOpenAIFormat(response.data, body.model);
  }

  async streamChatCompletions(body: any): Promise<any> {
    const aliyunBody = this.convertToAliyunFormat(body);
    aliyunBody.parameters.stream = true;
    
    const response = await this.client.post('/services/aigc/text-generation/generation', aliyunBody, {
      responseType: 'stream',
    });
    
    return response.data;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/models', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  private convertToAliyunFormat(body: any): any {
    const messages = body.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    return {
      model: this.mapModel(body.model),
      input: {
        messages,
      },
      parameters: {
        temperature: body.temperature,
        max_tokens: body.max_tokens,
        top_p: body.top_p,
        stream: body.stream || false,
      },
    };
  }

  private convertToOpenAIFormat(aliyunResponse: any, model: string): any {
    const output = aliyunResponse.output || {};
    const usage = aliyunResponse.usage || {};

    return {
      id: aliyunResponse.request_id || `aliyun-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: output.text || output.message?.content || '',
        },
        finish_reason: output.finish_reason || 'stop',
      }],
      usage: {
        prompt_tokens: usage.input_tokens || 0,
        completion_tokens: usage.output_tokens || 0,
        total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
      },
    };
  }

  private mapModel(model: string): string {
    const modelMap: Record<string, string> = {
      'qwen-turbo': 'qwen-turbo',
      'qwen-plus': 'qwen-plus',
      'qwen-max': 'qwen-max',
    };
    return modelMap[model] || model;
  }
}