import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/search
 * 全局搜索
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, type = 'all' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
      });
    }

    const searchTerm = q.toLowerCase();
    const results: any = {};

    // 搜索基因
    if (type === 'all' || type === 'genes') {
      results.genes = await prisma.gene.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        take: 10,
        include: {
          creator: {
            select: { address: true, name: true },
          },
        },
      });
    }

    // 搜索用户
    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { address: { contains: searchTerm, mode: 'insensitive' } },
            { name: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: {
          id: true,
          address: true,
          name: true,
          level: true,
        },
      });
    }

    // 搜索技能
    if (type === 'all' || type === 'skills') {
      results.skills = await prisma.skill.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        take: 10,
      });
    }

    res.json({
      success: true,
      data: results,
      query: searchTerm,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/suggestions
 * 搜索建议
 */
router.get('/suggestions', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const searchTerm = q.toLowerCase();

    const [genes, users] = await Promise.all([
      prisma.gene.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' },
          isActive: true,
        },
        take: 5,
        select: { id: true, name: true },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { address: { contains: searchTerm, mode: 'insensitive' } },
            { name: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, address: true, name: true },
      }),
    ]);

    const suggestions = [
      ...genes.map((g) => ({ type: 'gene', id: g.id, label: g.name })),
      ...users.map((u) => ({
        type: 'user',
        id: u.id,
        label: u.name || `${u.address.slice(0, 6)}...${u.address.slice(-4)}`,
      })),
    ];

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
