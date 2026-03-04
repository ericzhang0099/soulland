const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Request failed' };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // 用户相关
  async registerUser(address: string, email: string) {
    return this.request('/api/user/register', {
      method: 'POST',
      body: JSON.stringify({ address, email }),
    });
  }

  async getUserIdentity(address: string) {
    return this.request(`/api/user/${address}/identity`);
  }

  async getUserBalance(address: string) {
    return this.request(`/api/user/${address}/balance`);
  }

  // 基因市场
  async getGenes(filters?: { isActive?: boolean; minPrice?: number; maxPrice?: number }) {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
    if (filters?.minPrice) params.set('minPrice', String(filters.minPrice));
    if (filters?.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    
    return this.request(`/api/genes?${params.toString()}`);
  }

  async getGeneById(id: string) {
    return this.request(`/api/genes/${id}`);
  }

  // 交易
  async purchaseGene(buyer: string, seller: string, geneId: string, amount: string) {
    return this.request('/api/market/purchase', {
      method: 'POST',
      body: JSON.stringify({ buyer, seller, geneId, amount }),
    });
  }

  // 进化
  async recordEvolution(data: {
    agent: string;
    evoType: number;
    level: number;
    skillName: string;
    beforeScore: number;
    afterScore: number;
  }) {
    return this.request('/api/evolution/certify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEvolutions(agent: string) {
    return this.request(`/api/evolution/${agent}/evolutions`);
  }

  // 搜索
  async search(query: string, type?: string) {
    const params = new URLSearchParams();
    params.set('q', query);
    if (type) params.set('type', type);
    return this.request(`/api/search?${params.toString()}`);
  }

  async getSearchSuggestions(query: string) {
    return this.request(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  // 统计数据
  async getStats() {
    return this.request('/api/stats/overview');
  }

  // 活动 Feed
  async getActivityFeed(limit: number = 10) {
    return this.request(`/api/stats/activity?limit=${limit}`);
  }

  // 交易历史
  async getTransactions(address?: string) {
    const params = address ? `?address=${address}` : '';
    return this.request(`/api/market/transactions${params}`);
  }
}

export const apiClient = new ApiClient(API_URL);
