import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * 统一错误处理中间件
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      status: err.statusCode,
    });
  }

  // 处理其他类型的错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    });
  }

  // 默认500错误
  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
}

/**
 * 404处理
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

/**
 * 便捷错误创建函数
 */
export const errors = {
  badRequest: (message: string) => new ApiError(message, 400),
  unauthorized: (message: string = 'Unauthorized') => new ApiError(message, 401),
  forbidden: (message: string = 'Forbidden') => new ApiError(message, 403),
  notFound: (message: string = 'Not Found') => new ApiError(message, 404),
  conflict: (message: string) => new ApiError(message, 409),
  internal: (message: string = 'Internal Server Error') => new ApiError(message, 500),
};
