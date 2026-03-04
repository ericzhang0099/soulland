import { Router } from 'express';
import { geneService } from '../services/geneService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/genes
 * 获取基因列表
 */
router.get('/', async (req, res, next) => {
  try {
    const { isActive, minPrice, maxPrice } = req.query;
    
    const genes = await geneService.getGenes({
      isActive: isActive === 'true',
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });

    res.json({
      success: true,
      data: genes,
      count: genes.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/genes/:id
 * 获取基因详情
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const gene = await geneService.getGeneById(id);

    if (!gene) {
      return res.status(404).json({
        success: false,
        error: 'Gene not found',
      });
    }

    res.json({
      success: true,
      data: gene,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/genes
 * 创建基因（需要认证）
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { tokenId, name, description, price, metadata } = req.body;
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const gene = await geneService.createGene({
      tokenId,
      creatorId: req.user.id,
      name,
      description,
      price: Number(price),
      metadata,
    });

    res.status(201).json({
      success: true,
      data: gene,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/genes/:id/price
 * 更新基因价格
 */
router.put('/:id/price', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    const gene = await geneService.updatePrice(id, Number(price));

    res.json({
      success: true,
      data: gene,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
