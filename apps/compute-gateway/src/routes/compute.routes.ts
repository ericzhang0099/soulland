import { Router, Request, Response, NextFunction } from 'express';
import { ComputeService } from '../services/compute.service';
import { ChatCompletionRequest } from '../types';
import { body, validationResult } from 'express-validator';

/**
 * 算力路由
 */
export function createComputeRoutes(computeService: ComputeService) {
  const router = Router();

  /**
   * 聊天完成
   * POST /v1/chat/completions
   */
  router.post('/chat/completions',
    [
      body('model').isString().notEmpty(),
      body('messages').isArray({ min: 1 }),
      body('messages.*.role').isIn(['system', 'user', 'assistant']),
      body('messages.*.content').isString(),
      body('temperature').optional().isFloat({ min: 0, max: 2 }),
      body('max_tokens').optional().isInt({ min: 1 }),
      body('stream').optional().isBoolean(),
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      // 从JWT或header获取用户地址
      const userAddress = req.user?.address || req.headers['x-user-address'] as string;
      if (!userAddress) {
        return res.status(401).json({ error: 'User address required' });
      }

      const request: ChatCompletionRequest = {
        model: req.body.model,
        messages: req.body.messages,
        temperature: req.body.temperature,
        maxTokens: req.body.max_tokens,
        stream: req.body.stream || false,
        user: userAddress,
        priority: req.body.priority || 'normal',
      };

      try {
        // 流式响应
        if (request.stream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const generator = computeService.chatCompletionStream(request, userAddress);
          
          for await (const chunk of generator) {
            const data = {
              id: chunk.id,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: request.model,
              choices: [{
                index: 0,
                delta: { content: chunk.content },
                finish_reason: chunk.finishReason,
              }],
            };
            res.write(`data: ${JSON.stringify(data)}\n\n`);
          }
          
          res.write('data: [DONE]\n\n');
          return res.end();
        }

        // 非流式响应
        const response = await computeService.chatCompletion(request, userAddress);
        
        res.json({
          id: response.id,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: response.model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: response.content,
            },
            finish_reason: response.finishReason,
          }],
          usage: {
            prompt_tokens: response.usage.promptTokens,
            completion_tokens: response.usage.completionTokens,
            total_tokens: response.usage.totalTokens,
          },
          cost: response.cost,
          provider: response.provider,
        });

      } catch (error: any) {
        console.error('Chat completion error:', error);
        
        if (error.name === 'ComputeError') {
          return res.status(429).json({ 
            error: error.message,
            code: 'COMPUTE_ERROR'
          });
        }
        
        res.status(500).json({ 
          error: 'Internal server error',
          message: error.message 
        });
      }
    }
  );

  /**
   * 列出可用模型
   * GET /v1/models
   */
  router.get('/models', (req: Request, res: Response) => {
    const models = computeService.getAvailableModels();
    
    res.json({
      object: 'list',
      data: models.map(m => ({
        id: m.id,
        object: 'model',
        owned_by: m.provider,
        pricing: {
          input: m.inputPrice,
          output: m.outputPrice,
        },
      })),
    });
  });

  /**
   * 获取用户统计
   * GET /v1/users/me/stats
   */
  router.get('/users/me/stats', async (req: Request, res: Response) => {
    const userAddress = req.user?.address || req.headers['x-user-address'] as string;
    if (!userAddress) {
      return res.status(401).json({ error: 'User address required' });
    }

    try {
      const stats = await computeService.getUserStats(userAddress);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * 估算成本
   * POST /v1/cost/estimate
   */
  router.post('/cost/estimate',
    [
      body('model').isString(),
      body('messages').isArray(),
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { model, messages } = req.body;
      
      // 估算token数
      const estimatedTokens = messages.reduce((sum: number, m: any) => 
        sum + (m.content?.length || 0) * 0.4, 0) + 100;
      
      // 获取模型定价
      const models = computeService.getAvailableModels();
      const modelInfo = models.find(m => m.id === model);
      
      if (!modelInfo) {
        return res.status(404).json({ error: 'Model not found' });
      }

      const inputCost = (estimatedTokens / 1000) * modelInfo.inputPrice;
      const outputCost = (estimatedTokens / 1000) * modelInfo.outputPrice;
      
      res.json({
        model,
        estimated_tokens: Math.ceil(estimatedTokens),
        estimated_cost: {
          input: inputCost,
          output: outputCost,
          total: inputCost + outputCost,
        },
        pricing: {
          input_per_1k: modelInfo.inputPrice,
          output_per_1k: modelInfo.outputPrice,
        },
      });
    }
  );

  return router;
}
