import { Router } from 'express';
import { userService } from '../services/userService';

const router = Router();

/**
 * GET /api/leaderboard
 * 获取等级排行榜
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit } = req.query;
    
    const leaderboard = await userService.getLeaderboard(
      limit ? Number(limit) : 100
    );

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
