import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserService {
  /**
   * 创建用户
   */
  async createUser(address: string, email: string, name?: string) {
    return prisma.user.create({
      data: {
        address,
        email,
        name,
      },
    });
  }

  /**
   * 根据地址获取用户
   */
  async getUserByAddress(address: string) {
    return prisma.user.findUnique({
      where: { address },
      include: {
        genes: true,
        evolutions: true,
      },
    });
  }

  /**
   * 更新用户身份NFT
   */
  async updateIdentityToken(address: string, tokenId: string, level: number) {
    return prisma.user.update({
      where: { address },
      data: {
        identityTokenId: tokenId,
        level,
      },
    });
  }

  /**
   * 更新用户贡献值
   */
  async updateContribution(address: string, contribution: number) {
    return prisma.user.update({
      where: { address },
      data: { contribution },
    });
  }

  /**
   * 获取等级排行榜
   */
  async getLeaderboard(limit: number = 100) {
    return prisma.user.findMany({
      orderBy: [
        { level: 'asc' },
        { contribution: 'desc' },
      ],
      take: limit,
      select: {
        address: true,
        name: true,
        level: true,
        contribution: true,
      },
    });
  }
}

export const userService = new UserService();
