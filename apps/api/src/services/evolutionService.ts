import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EvolutionService {
  /**
   * 记录进化
   */
  async recordEvolution(data: {
    agentId: string;
    level: number;
    evoType: string;
    skillName: string;
    beforeScore: number;
    afterScore: number;
    improvement: number;
    traceHash: string;
    txHash?: string;
  }) {
    return prisma.evolution.create({
      data,
    });
  }

  /**
   * 获取Agent的进化记录
   */
  async getEvolutionsByAgent(agentId: string) {
    return prisma.evolution.findMany({
      where: { agentId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 获取进化统计
   */
  async getEvolutionStats() {
    const [totalEvolutions, levelStats] = await Promise.all([
      prisma.evolution.count(),
      prisma.evolution.groupBy({
        by: ['level'],
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      totalEvolutions,
      levelStats: levelStats.map(s => ({
        level: s.level,
        count: s._count.id,
      })),
    };
  }

  /**
   * 获取最高进化等级
   */
  async getHighestLevel(agentId: string) {
    const result = await prisma.evolution.findFirst({
      where: { agentId },
      orderBy: {
        level: 'desc',
      },
      select: {
        level: true,
      },
    });

    return result?.level || 0;
  }
}

export const evolutionService = new EvolutionService();
