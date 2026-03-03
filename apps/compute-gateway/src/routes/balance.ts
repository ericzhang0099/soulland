import { Router } from 'express';
import { getBalance } from '../controllers/balanceController';

const router = Router();

// GET /v1/balance - 获取AGC积分余额
router.get('/', getBalance);

export default router;