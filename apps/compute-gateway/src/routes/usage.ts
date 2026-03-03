import { Router } from 'express';
import { getUsage, getUsageStats } from '../controllers/usageController';

const router = Router();

// GET /v1/usage - 获取用量记录
router.get('/', getUsage);

// GET /v1/usage/stats - 获取用量统计
router.get('/stats', getUsageStats);

export default router;