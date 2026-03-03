import axios, { AxiosInstance } from 'axios';
import { ProviderConfig } from '../../config';
import { logger } from '../../utils/logger';
import { Provider } from '../providerRouter';

export class ZhipuProvider implements Provider {
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
    const zhipuBody = this.convertToZhipuFormat(body);
    
    const response = await this.client.post('/chat/completions', zhipuBody);
    
    return response.data;
  }

  async streamChatCompletions(body: any): Promise<any> {
    const zhipuBody = this.convertToZhipuFormat(body);
    zhipuBody.stream = true;
    
    const response = await this.client.post('/chat/completions', zhipuBody, {
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

  private convertToZhipuFormat(body: any): any {
    return {
      model: this.mapModel(body.model),
      messages: body.messages,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      top_p: body.top_p,
      stream: body.stream || false,
    };
  }

  private mapModel(model: string): string {
    const modelMap: Record<string, string> = {
      'glm-4': 'glm-4',
      'glm-3-turbo': 'glm-3-turbo',
    };
    return modelMap[model] || model;
  }
}