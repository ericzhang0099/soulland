import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createContainer, registerProviders } from './services/container';
import { createComputeRoutes } from './routes/compute.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 初始化依赖
const container = createContainer();

// 注册供应商
registerProviders(container.router);

// 启动健康检查
container.router.startHealthChecks(30000);

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: container.router.getProviderStatus(),
  });
});

// API路由
app.use('/v1', createComputeRoutes(container.computeService));

// 管理API
app.get('/admin/providers', (req: Request, res: Response) => {
  res.json(container.router.getProviderStatus());
});

// 404处理
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// 错误处理
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`GenLoop Compute Gateway running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Registered providers:`, Array.from(container.router.getAdapters().keys()));
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await container.router.close();
  await container.quotaService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await container.router.close();
  await container.quotaService.close();
  process.exit(0);
});

export default app;
