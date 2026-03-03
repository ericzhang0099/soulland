import { Request, Response, NextFunction } from 'express';
import { usageService } from '../services/usageService';
import { logger } from '../utils/logger';

export const getUsage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { 
      startDate, 
      endDate, 
      model, 
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);

    const usage = await usageService.getUsageRecords({
      userId,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      model: model as string | undefined,
      page: pageNum,
      limit: limitNum,
    });

    logger.info({
      action: 'get_usage',
      userId,
      recordCount: usage.records.length,
    });

    res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsageStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { period = '7d' } = req.query;

    const stats = await usageService.getUsageStats({
      userId,
      period: period as string,
    });

    logger.info({
      action: 'get_usage_stats',
      userId,
      period,
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};