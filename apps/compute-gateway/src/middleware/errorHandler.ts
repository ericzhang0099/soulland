import { Request, Response, NextFunction } from 'express';
import { logger, logError } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 常见错误类型
export const Errors = {
  // 认证错误
  UNAUTHORIZED: (message = '未授权访问') => 
    new AppError(message, 401, 'UNAUTHORIZED'),
  
  FORBIDDEN: (message = '禁止访问') => 
    new AppError(message, 403, 'FORBIDDEN'),
  
  // 请求错误
  BAD_REQUEST: (message = '请求参数错误') => 
    new AppError(message, 400, 'BAD_REQUEST'),
  
  NOT_FOUND: (message = '资源不存在') => 
    new AppError(message, 404, 'NOT_FOUND'),
  
  // 业务错误
  INSUFFICIENT_BALANCE: (message = 'AGC积分余额不足') => 
    new AppError(message, 402, 'INSUFFICIENT_BALANCE'),
  
  RATE_LIMIT_EXCEEDED: (message = '请求频率超限') => 
    new AppError(message, 429, 'RATE_LIMIT_EXCEEDED'),
  
  MODEL_NOT_AVAILABLE: (message = '模型暂不可用') => 
    new AppError(message, 503, 'MODEL_NOT_AVAILABLE'),
  
  PROVIDER_ERROR: (message = '供应商服务异常') => 
    new AppError(message, 502, 'PROVIDER_ERROR'),
  
  // 系统错误
  INTERNAL_ERROR: (message = '服务器内部错误') => 
    new AppError(message, 500, 'INTERNAL_ERROR'),
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // 默认错误信息
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = '服务器内部错误';
  let stack: string | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    
    // 只在开发环境返回非运营错误的堆栈
    if (!err.isOperational && process.env.NODE_ENV === 'development') {
      stack = err.stack;
    }
  } else {
    // 未知错误
    logError(err, {
      path: req.path,
      method: req.method,
      requestId: req.headers['x-request-id'],
    });
    
    if (process.env.NODE_ENV === 'development') {
      stack = err.stack;
    }
  }

  // 记录运营错误
  if (err instanceof AppError && err.isOperational) {
    logger.warn({
      type: 'operational_error',
      code: errorCode,
      message,
      path: req.path,
      method: req.method,
      requestId: req.headers['x-request-id'],
    });
  }

  const response: Record<string, unknown> = {
    error: {
      code: errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  };

  if (stack) {
    response.error.stack = stack;
  }

  res.status(statusCode).json(response);
};