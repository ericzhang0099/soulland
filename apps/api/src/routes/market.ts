import { Router } from 'express';
import { blockchainService } from '../services/blockchain';

const router = Router();

/**
 * POST /api/market/purchase
 * 购买基因
 */
router.post('/purchase', async (req, res) => {
  try {
    const { buyer, seller, amount } = req.body;
    
    if (!buyer || !seller || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const txHash = await blockchainService.processTransaction(buyer, seller, amount);
    
    res.json({
      success: true,
      txHash,
      message: 'Purchase successful'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/market/recommendation/deduct
 * 推荐服务扣费
 */
router.post('/recommendation/deduct', async (req, res) => {
  try {
    const { userAddress, amount } = req.body;
    
    if (!userAddress || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const txHash = await blockchainService.platformDeduct(
      userAddress,
      amount,
      'Platform recommendation service'
    );
    
    res.json({
      success: true,
      txHash,
      deducted: amount,
      currency: 'AGC'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
