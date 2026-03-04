import { Router } from 'express';
import { blockchainService } from '../services/blockchain';

const router = Router();

/**
 * POST /api/evolution/certify
 * 颁发进化证明
 */
router.post('/certify', async (req, res) => {
  try {
    const { agent, evoType, level, skillName, beforeScore, afterScore } = req.body;
    
    if (!agent || !skillName || !beforeScore || !afterScore) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const txHash = await blockchainService.certifyEvolution(
      agent,
      evoType,
      level,
      skillName,
      beforeScore,
      afterScore
    );
    
    res.json({
      success: true,
      txHash,
      agent,
      level,
      skillName,
      improvement: `${((afterScore - beforeScore) / beforeScore * 100).toFixed(2)}%`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/evolution/:agent/evolutions
 * 获取Agent的进化记录
 */
router.get('/:agent/evolutions', async (req, res) => {
  try {
    const { agent } = req.params;
    // 这里需要从合约获取进化记录
    
    res.json({
      success: true,
      agent,
      evolutions: [] // 待实现
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
