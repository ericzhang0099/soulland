import axios, { AxiosInstance } from 'axios';
import { ProviderConfig } from '../config';
import { logger } from '../utils/logger';
import { Provider } from '../providerRouter';

export class OpenAIProvider implements Provider {
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
      timeout: 120000, // 2分钟超时
    });

    // 响应拦截器
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
    const response = await this.client.post('/chat/completions', body);
    return response.data;
  }

  async streamChatCompletions(body: any): Promise<any> {
    const response = await this.client.post('/chat/completions', 
      { ...body, stream: true },
      { responseType: 'stream' }
    );
    return response.data;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // 使用models接口检查健康状态
      await this.client.get('/models', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}