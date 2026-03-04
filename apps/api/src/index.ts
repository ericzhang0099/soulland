import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import userRoutes from './routes/user';
import genesRoutes from './routes/genes';
import marketRoutes from './routes/market';
import evolutionRoutes from './routes/evolution';
import leaderboardRoutes from './routes/leaderboard';
import statsRoutes from './routes/stats';
import searchRoutes from './routes/search';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// 路由
app.use('/api/user', userRoutes);
app.use('/api/genes', genesRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/evolution', evolutionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/search', searchRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    uptime: process.uptime(),
  });
});

// 404处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 GenLoop 3.0 API Server running on port ${PORT}`);
  console.log(`📚 API Endpoints:`);
  console.log(`   - /api/user`);
  console.log(`   - /api/genes`);
  console.log(`   - /api/market`);
  console.log(`   - /api/evolution`);
  console.log(`   - /api/leaderboard`);
  console.log(`   - /api/stats`);
  console.log(`   - /api/search`);
});

export default app;
