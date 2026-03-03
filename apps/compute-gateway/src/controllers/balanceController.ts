import { Request, Response, NextFunction } from 'express';
import { agcService } from '../services/agcService';
import { logger } from '../utils/logger';

export const getBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    
    const balance = await agcService.getBalance(userId);
    const holdAmount = await agcService.getHoldAmount(userId);
    
    logger.info({
      action: 'get_balance',
      userId,
      balance,
      holdAmount,
    });

    res.json({
      success: true,
      data: {
        userId,
        balance,
        holdAmount,
        availableBalance: balance - holdAmount,
        currency: 'AGC',
      },
    });
  } catch (error) {
    next(error);
  }
};