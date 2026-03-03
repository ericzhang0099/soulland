import { Router } from '../core/router';
import { PointsService } from './points.service';
import { QuotaService } from './quota.service';
import { 
  ChatCompletionRequest, 
  ChatCompletionResponse, 
  StreamChunk,
  UsageRecord 
} from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 算力服务 - 核心业务逻辑
 */
export class ComputeService {
  private router: Router;
  private pointsService: PointsService;
  private quotaService: QuotaService;

  constructor(
    router: Router,
    pointsService: PointsService,
    quotaService: QuotaService
  ) {
    this.router = router;
    this.pointsService = pointsService;
    this.quotaService = quotaService;
  }

  /**
   * 聊天完成
   */
  async chatCompletion(
    request: ChatCompletionRequest,
    userAddress: string
  ): Promise<ChatCompletionResponse> {
    const requestId = uuidv4();

    // 1. 估算成本
    const estimatedTokens = this.estimateTokens(request);
    const estimatedCost = this.estimateCost(request.model, estimatedTokens);

    // 2. 检查配额
    const quotaCheck = await this.quotaService.checkQuota(
      userAddress,
      estimatedTokens,
      estimatedCost
    );
    
    if (!quotaCheck.allowed) {
      throw new ComputeError(`Quota exceeded: ${quotaCheck.reason}`);
    }

    // 3. 检查AGC积分余额
    const balance = await this.pointsService.getBalance(userAddress);
    const requiredPoints = this.pointsService.parsePoints(estimatedCost.toString());
    
    if (balance < requiredPoints) {
      throw new ComputeError(
        `Insufficient AGC points. Required: ${estimatedCost}, Balance: ${this.pointsService.formatPoints(balance)}`
      );
    }

    // 4. 执行请求
    let response: ChatCompletionResponse;
    try {
      response = await this.router.route(request);
    } catch (error) {
      throw new ComputeError(`Request failed: ${error}`);
    }

    // 5. 扣除AGC积分
    const actualCost = this.pointsService.parsePoints(response.cost.toString());
    const deducted = await this.pointsService.deductPoints(userAddress, actualCost);
    
    if (!deducted) {
      console.error(`Failed to deduct points for ${userAddress}`);
      // 不中断响应，但记录错误
    }

    // 6. 记录用量
    const usageRecord: UsageRecord = {
      requestId,
      userId: userAddress,
      provider: response.provider,
      model: response.model,
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
      cost: response.cost,
      latencyMs: response.latencyMs,
      timestamp: new Date(),
      success: true,
    };
    
    await this.quotaService.recordUsage(usageRecord);

    return response;
  }

  /**
   * 流式聊天完成
   */
  async *chatCompletionStream(
    request: ChatCompletionRequest,
    userAddress: string
  ): AsyncGenerator<StreamChunk> {
    const requestId = uuidv4();

    // 估算成本
    const estimatedTokens = this.estimateTokens(request);
    const estimatedCost = this.estimateCost(request.model, estimatedTokens);

    // 检查配额
    const quotaCheck = await this.quotaService.checkQuota(
      userAddress,
      estimatedTokens,
      estimatedCost
    );
    
    if (!quotaCheck.allowed) {
      throw new ComputeError(`Quota exceeded: ${quotaCheck.reason}`);
    }

    // 检查余额
    const balance = await this.pointsService.getBalance(userAddress);
    const requiredPoints = this.pointsService.parsePoints(estimatedCost.toString());
    
    if (balance < requiredPoints) {
      throw new ComputeError('Insufficient AGC points');
    }

    // 收集流式内容
    const contentParts: string[] = [];
    
    try {
      for await (const chunk of this.router.routeStream(request)) {
        contentParts.push(chunk.content);
        yield chunk;
      }

      // 计算实际用量
      const totalContent = contentParts.join('');
      const actualTokens = Math.ceil(totalContent.length * 0.4);
      const actualCost = this.estimateCost(request.model, actualTokens);

      // 扣除积分
      const costInPoints = this.pointsService.parsePoints(actualCost.toString());
      await this.pointsService.deductPoints(userAddress, costInPoints);

      // 记录用量
      await this.quotaService.recordUsage({
        requestId,
        userId: userAddress,
        provider: 'stream',
        model: request.model,
        promptTokens: estimatedTokens,
        completionTokens: actualTokens,
        totalTokens: estimatedTokens + actualTokens,
        cost: actualCost,
        latencyMs: 0,
        timestamp: new Date(),
        success: true,
      });

    } catch (error) {
      throw new ComputeError(`Stream failed: ${error}`);
    }
  }

  /**
   * 获取可用模型
   */
  getAvailableModels(): Array<{
    id: string;
    provider: string;
    inputPrice: number;
    outputPrice: number;
  }> {
    const models: Array<{ id: string; provider: string; inputPrice: number; outputPrice: number }> = [];

    this.router.getAdapters().forEach((adapter, name) => {
      adapter.config.models.forEach(modelId => {
        const pricing = (adapter as any).getModelPricing?.(modelId) || { input: 1, output: 2 };
        models.push({
          id: modelId,
          provider: name,
          inputPrice: pricing.input,
          outputPrice: pricing.output,
        });
      });
    });

    return models;
  }

  /**
   * 获取用户统计
   */
  async getUserStats(userAddress: string) {
    const [balance, usageStats] = await Promise.all([
      this.pointsService.getBalance(userAddress),
      this.quotaService.getUsageStats(userAddress),
    ]);

    return {
      balance: this.pointsService.formatPoints(balance),
      balanceRaw: balance.toString(),
      usage: usageStats,
    };
  }

  /**
   * 估算token数
   */
  private estimateTokens(request: ChatCompletionRequest): number {
    return request.messages.reduce((sum, m) => sum + m.content.length * 0.4, 0) + 100;
  }

  /**
   * 估算成本
   */
  private estimateCost(model: string, tokens: number): number {
    // 简化估算，实际应从适配器获取
    const basePrice = model.includes('gpt-4') ? 30 : 
                     model.includes('claude-3-opus') ? 15 :
                     model.includes('qwen') ? 0.5 : 1;
    return (tokens / 1000) * basePrice;
  }
}

/**
 * 算力错误
 */
export class ComputeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComputeError';
  }
}
