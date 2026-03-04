import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/stats/overview
 * 获取平台概览统计
 */
router.get('/overview', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalGenes,
      totalTransactions,
      totalVolume,
      activeGenes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.gene.count(),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.gene.count({ where: { isActive: true } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalGenes,
        totalTransactions,
        totalVolume: totalVolume._sum.amount || 0,
        activeGenes,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats/activity
 * 获取最近活动
 */
router.get('/activity', async (req, res, next) => {
  try {
    const { limit = '10' } = req.query;

    const [transactions, evolutions] = await Promise.all([
      prisma.transaction.findMany({
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { address: true } },
          gene: { select: { name: true } },
        },
      }),
      prisma.evolution.findMany({
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          agent: { select: { address: true } },
        },
      }),
    ]);

    // 合并并按时间排序
    const activities = [
      ...transactions.map((t) => ({
        type: 'transaction',
        id: t.id,
        description: `${t.buyer.address.slice(0, 6)}... 购买了 ${t.gene?.name || '基因'}`,
        amount: t.amount,
        timestamp: t.createdAt,
      })),
      ...evolutions.map((e) => ({
        type: 'evolution',
        id: e.id,
        description: `${e.agent.address.slice(0, 6)}... 完成了 ${e.skillName} 训练`,
        level: e.level,
        timestamp: e.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, Number(limit));

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats/trends
 * 获取趋势数据
 */
router.get('/trends', async (req, res, next) => {
  try {
    const { days = '7' } = req.query;
    const daysNum = Number(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const [dailyTransactions, dailyUsers] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED',
        },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        transactions: dailyTransactions,
        users: dailyUsers,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
