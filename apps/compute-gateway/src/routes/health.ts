import { Router } from 'express';
import { healthCheck, readinessCheck } from '../controllers/healthController';

const router = Router();

// GET /health - 健康检查
router.get('/', healthCheck);

// GET /health/ready - 就绪检查
router.get('/ready', readinessCheck);

export default router;