import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GeneService {
  /**
   * 创建基因记录
   */
  async createGene(data: {
    tokenId: string;
    creatorId: string;
    name: string;
    description?: string;
    price: number;
    metadata?: any;
  }) {
    return prisma.gene.create({
      data: {
        ...data,
        ownerId: data.creatorId,
        price: data.price,
      },
    });
  }

  /**
   * 获取基因列表
   */
  async getGenes(filters?: {
    isActive?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }) {
    return prisma.gene.findMany({
      where: {
        isActive: filters?.isActive ?? true,
        price: {
          gte: filters?.minPrice,
          lte: filters?.maxPrice,
        },
      },
      include: {
        creator: {
          select: {
            address: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 获取基因详情
   */
  async getGeneById(id: string) {
    return prisma.gene.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            address: true,
            name: true,
            level: true,
          },
        },
      },
    });
  }

  /**
   * 更新基因价格
   */
  async updatePrice(id: string, price: number) {
    return prisma.gene.update({
      where: { id },
      data: { price },
    });
  }

  /**
   * 转移基因所有权
   */
  async transferOwnership(id: string, newOwnerId: string) {
    return prisma.gene.update({
      where: { id },
      data: { ownerId: newOwnerId },
    });
  }
}

export const geneService = new GeneService();
