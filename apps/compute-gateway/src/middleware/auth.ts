import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { Errors } from './errorHandler';

// 扩展Express Request类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        apiKey: string;
        email?: string;
      };
    }
  }
}

// API Key认证
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 健康检查路径跳过认证
  if (req.path.startsWith('/health')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next(Errors.UNAUTHORIZED('缺少Authorization头'));
  }

  // Bearer Token认证
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(Errors.UNAUTHORIZED('Authorization格式错误，应为: Bearer {token}'));
  }

  const token = parts[1];

  try {
    // 验证JWT
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      apiKey: string;
      email?: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(Errors.UNAUTHORIZED('Token已过期'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(Errors.UNAUTHORIZED('无效的Token'));
    }
    return next(Errors.UNAUTHORIZED('认证失败'));
  }
};

// 可选认证（用于某些公开接口）
export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next();
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      apiKey: string;
      email?: string;
    };
    req.user = decoded;
  } catch {
    // 可选认证失败不阻止请求
  }
  
  next();
};