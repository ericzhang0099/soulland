import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { logger } from './utils/logger';
import { config } from './config';

import chatRoutes from './routes/chat';
import usageRoutes from './routes/usage';
import balanceRoutes from './routes/balance';
import healthRoutes from './routes/health';

dotenv.config();

const app: Application = express();

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));

// 日志中间件
app.use(morgan(config.logFormat === 'json' ? 'combined' : 'dev', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查（不需要认证）
app.use('/health', healthRoutes);

// API速率限制
app.use(rateLimitMiddleware);

// 认证中间件
app.use(authMiddleware);

// API路由
app.use('/v1/chat', chatRoutes);
app.use('/v1/usage', usageRoutes);
app.use('/v1/balance', balanceRoutes);

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`算力网关服务已启动`);
  logger.info(`环境: ${config.nodeEnv}`);
  logger.info(`端口: ${PORT}`);
  logger.info(`可用供应商: ${config.providers.filter(p => p.enabled).map(p => p.name).join(', ')}`);
});

export default app;