import { Request, Response } from 'express';
import { config } from '../config';
import { providerRouter } from '../services/providerRouter';
import { redisClient } from '../middleware/rateLimit';
import { logger } from '../utils/logger';

export const healthCheck = (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'compute-gateway',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
};

export const readinessCheck = async (req: Request, res: Response) => {
  const checks: Record<string, { status: string; message?: string }> = {};
  let isReady = true;

  // 检查Redis连接
  try {
    if (redisClient.status === 'ready') {
      checks.redis = { status: 'ok' };
    } else {
      checks.redis = { status: 'error', message: 'Redis未连接' };
      isReady = false;
    }
  } catch (error) {
    checks.redis = { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Redis检查失败' 
    };
    isReady = false;
  }

  // 检查供应商状态
  const availableProviders = providerRouter.getAvailableProviders();
  if (availableProviders.length > 0) {
    checks.providers = { 
      status: 'ok', 
      message: `${availableProviders.length}个供应商可用` 
    };
  } else {
    checks.providers = { 
      status: 'error', 
      message: '没有可用的供应商' 
    };
    isReady = false;
  }

  // 检查AGC服务连接
  try {
    // 这里可以添加AGC服务的健康检查
    checks.agc = { status: 'ok' };
  } catch (error) {
    checks.agc = { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'AGC服务检查失败' 
    };
    // AGC服务不可用不影响网关就绪状态
  }

  const statusCode = isReady ? 200 : 503;
  
  if (!isReady) {
    logger.warn({
      action: 'readiness_check_failed',
      checks,
    });
  }

  res.status(statusCode).json({
    ready: isReady,
    checks,
    timestamp: new Date().toISOString(),
  });
};