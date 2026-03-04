import { Router } from 'express';
import { blockchainService } from '../services/blockchain';

const router = Router();

/**
 * POST /api/user/register
 * 注册用户，铸造身份NFT
 */
router.post('/register', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    const txHash = await blockchainService.mintIdentity(address);
    
    res.json({
      success: true,
      txHash,
      message: 'Identity NFT minted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/:address/identity
 * 获取用户身份信息
 */
router.get('/:address/identity', async (req, res) => {
  try {
    const { address } = req.params;
    const identity = await blockchainService.getIdentity(address);
    
    res.json({
      success: true,
      data: identity
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/:address/balance
 * 获取用户AGC余额
 */
router.get('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await blockchainService.getAGCBalance(address);
    
    res.json({
      success: true,
      address,
      balance,
      currency: 'AGC'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
