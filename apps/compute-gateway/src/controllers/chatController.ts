import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { providerRouter } from '../services/providerRouter';
import { agcService } from '../services/agcService';
import { usageService } from '../services/usageService';
import { checkModelRateLimit } from '../middleware/rateLimit';
import { Errors } from '../middleware/errorHandler';
import { logger, createRequestLogger } from '../utils/logger';
import { MODEL_COST_CONFIG } from '../config';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string;
  name?: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
}

export const chatCompletions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = uuidv4();
  const requestLogger = createRequestLogger(requestId);
  const startTime = Date.now();
  
  try {
    const body = req.body as ChatCompletionRequest;
    const { model, messages, stream = false } = body;
    const userId = req.user!.userId;
    
    requestLogger.info({
      action: 'chat_completions_start',
      userId,
      model,
      stream,
      messageCount: messages.length,
    });

    // 1. 检查模型速率限制
    await checkModelRateLimit(model, userId);

    // 2. 估算所需积分
    const inputTokens = estimateTokens(messages);
    const maxTokens = body.max_tokens || 2048;
    const estimatedCost = calculateEstimatedCost(model, inputTokens, maxTokens);

    // 3. 检查用户余额
    const balance = await agcService.getBalance(userId);
    if (balance < estimatedCost) {
      throw Errors.INSUFFICIENT_BALANCE(
        `AGC积分余额不足。需要: ${estimatedCost}, 可用: ${balance}`
      );
    }

    // 4. 预扣积分
    const holdId = await agcService.holdBalance(userId, estimatedCost, requestId);

    try {
      // 5. 路由到供应商
      const provider = providerRouter.selectProvider(model);
      
      if (!provider) {
        await agcService.releaseHold(holdId);
        throw Errors.MODEL_NOT_AVAILABLE(`模型 ${model} 暂无可用的供应商`);
      }

      requestLogger.info({
        action: 'provider_selected',
        provider: provider.name,
        model,
      });

      // 6. 处理流式请求
      if (stream) {
        await handleStreamRequest(
          req, res, provider, body, userId, requestId, holdId, estimatedCost, startTime
        );
      } else {
        // 7. 处理普通请求
        await handleNormalRequest(
          req, res, provider, body, userId, requestId, holdId, estimatedCost, startTime
        );
      }
    } catch (error) {
      // 请求失败，释放预扣积分
      await agcService.releaseHold(holdId);
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// 处理普通请求
async function handleNormalRequest(
  req: Request,
  res: Response,
  provider: any,
  body: ChatCompletionRequest,
  userId: string,
  requestId: string,
  holdId: string,
  estimatedCost: number,
  startTime: number
) {
  const requestLogger = createRequestLogger(requestId);
  
  try {
    const response = await provider.chatCompletions(body);
    const duration = Date.now() - startTime;
    
    // 计算实际消耗
    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0 };
    const actualCost = calculateActualCost(body.model, usage.prompt_tokens, usage.completion_tokens);
    
    // 扣除实际积分，退还差额
    await agcService.deductBalance(userId, actualCost, requestId);
    if (estimatedCost > actualCost) {
      await agcService.releaseHold(holdId);
      await agcService.refundBalance(userId, estimatedCost - actualCost, requestId);
    }

    // 记录用量
    await usageService.recordUsage({
      userId,
      requestId,
      model: body.model,
      provider: provider.name,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      cost: actualCost,
      duration,
      status: 'success',
    });

    requestLogger.info({
      action: 'chat_completions_complete',
      userId,
      model: body.model,
      duration,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      cost: actualCost,
    });

    // 添加自定义头
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Provider', provider.name);
    res.setHeader('X-AGC-Cost', actualCost.toString());
    
    res.json({
      ...response,
      request_id: requestId,
    });
  } catch (error) {
    requestLogger.error({
      action: 'chat_completions_error',
      userId,
      model: body.model,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// 处理流式请求
async function handleStreamRequest(
  req: Request,
  res: Response,
  provider: any,
  body: ChatCompletionRequest,
  userId: string,
  requestId: string,
  holdId: string,
  estimatedCost: number,
  startTime: number
) {
  const requestLogger = createRequestLogger(requestId);
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Provider', provider.name);
  
  let outputTokens = 0;
  let inputTokens = 0;
  let isComplete = false;
  
  try {
    const stream = await provider.streamChatCompletions(body);
    
    stream.on('data', (chunk: any) => {
      // 解析SSE数据
      const lines = chunk.toString().split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            isComplete = true;
            res.write('data: [DONE]\n\n');
            
            // 计算实际消耗并扣费
            const actualCost = calculateActualCost(body.model, inputTokens, outputTokens);
            agcService.deductBalance(userId, actualCost, requestId).catch(console.error);
            
            // 记录用量
            usageService.recordUsage({
              userId,
              requestId,
              model: body.model,
              provider: provider.name,
              inputTokens,
              outputTokens,
              cost: actualCost,
              duration: Date.now() - startTime,
              status: 'success',
            }).catch(console.error);
            
            res.end();
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            
            // 统计token数（粗略估计）
            if (parsed.choices?.[0]?.delta?.content) {
              outputTokens += Math.ceil(parsed.choices[0].delta.content.length / 4);
            }
            if (parsed.usage?.prompt_tokens) {
              inputTokens = parsed.usage.prompt_tokens;
            }
            if (parsed.usage?.completion_tokens) {
              outputTokens = parsed.usage.completion_tokens;
            }
            
            // 添加request_id到每个chunk
            parsed.request_id = requestId;
            res.write(`data: ${JSON.stringify(parsed)}\n\n`);
          } catch {
            res.write(`${line}\n\n`);
          }
        }
      }
    });
    
    stream.on('error', async (error: Error) => {
      requestLogger.error({
        action: 'stream_error',
        userId,
        model: body.model,
        error: error.message,
      });
      
      // 释放预扣积分
      await agcService.releaseHold(holdId);
      
      if (!res.writableEnded) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    });
    
    stream.on('end', () => {
      if (!isComplete && !res.writableEnded) {
        res.end();
      }
    });
    
    // 客户端断开连接处理
    req.on('close', async () => {
      if (!isComplete) {
        await agcService.releaseHold(holdId);
      }
    });
    
  } catch (error) {
    await agcService.releaseHold(holdId);
    throw error;
  }
}

// 估算token数（粗略估计）
function estimateTokens(messages: ChatMessage[]): number {
  let tokens = 0;
  for (const msg of messages) {
    // 每个消息大约4个token开销
    tokens += 4;
    // 内容每4个字符约1个token
    tokens += Math.ceil(msg.content.length / 4);
  }
  // 回复开销
  tokens += 3;
  return tokens;
}

// 计算预估成本
function calculateEstimatedCost(model: string, inputTokens: number, outputTokens: number): number {
  const cost = MODEL_COST_CONFIG[model];
  if (!cost) {
    // 默认成本
    return Math.ceil((inputTokens + outputTokens) * 0.01);
  }
  return Math.ceil((inputTokens * cost.input + outputTokens * cost.output) / 1000);
}

// 计算实际成本
function calculateActualCost(model: string, inputTokens: number, outputTokens: number): number {
  return calculateEstimatedCost(model, inputTokens, outputTokens);
}