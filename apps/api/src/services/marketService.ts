import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MarketService {
  /**
   * 创建交易记录
   */
  async createTransaction(data: {
    buyerId: string;
    sellerId: string;
    geneId?: string;
    amount: number;
    txHash: string;
    type: 'GENE_PURCHASE' | 'GENE_SALE' | 'SKILL_PURCHASE' | 'PLATFORM_FEE' | 'REWARD';
  }) {
    return prisma.transaction.create({
      data: {
        ...data,
        status: 'COMPLETED',
      },
    });
  }

  /**
   * 获取交易历史
   */
  async getTransactions(userId?: string) {
    return prisma.transaction.findMany({
      where: userId ? {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
      } : undefined,
      include: {
        buyer: {
          select: {
            address: true,
            name: true,
          },
        },
        gene: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 获取市场统计
   */
  async getMarketStats() {
    const [totalVolume, totalTransactions, activeGenes] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
        },
      }),
      prisma.transaction.count({
        where: { status: 'COMPLETED' },
      }),
      prisma.gene.count({
        where: { isActive: true },
      }),
    ]);

    return {
      totalVolume: totalVolume._sum.amount || 0,
      totalTransactions,
      activeGenes,
    };
  }
}

export const marketService = new MarketService();
