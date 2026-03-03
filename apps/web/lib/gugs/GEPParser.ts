/**
 * GEPParser - EvoMap GEP (Gene Expression Profile) 格式解析器
 * 
 * GEP 是 EvoMap 平台使用的 JSON 格式基因标准
 */

import {
  GeneFormat,
  GeneType,
  type GeneParser,
  type ParseResult,
  type UnifiedGene,
  type GEPGene,
  type GEPTrait,
  type GEPBehavior,
  computeContentHash,
} from './UnifiedGene';

export class GEPParser implements GeneParser<GEPGene> {
  readonly format = GeneFormat.GEP;
  readonly mimeType = 'application/json';

  /**
   * 解析 GEP JSON 字符串
   */
  parse(data: string): ParseResult<GEPGene> {
    try {
      const warnings: string[] = [];
      
      // 解析 JSON
      let parsed: any;
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        return { success: false, error: 'Invalid JSON format' };
      }

      // 验证必需字段
      if (!parsed.gene_id) {
        return { success: false, error: 'Missing required field: gene_id' };
      }
      if (!parsed.name) {
        return { success: false, error: 'Missing required field: name' };
      }
      if (!parsed.traits || !Array.isArray(parsed.traits)) {
        return { success: false, error: 'Missing or invalid field: traits' };
      }

      // 验证 traits
      for (const trait of parsed.traits) {
        if (!trait.id || !trait.name || trait.weight === undefined) {
          warnings.push(`Invalid trait structure: ${JSON.stringify(trait)}`);
        }
      }

      // 构建 GEPGene 对象
      const gene: GEPGene = {
        version: parsed.version || '1.0',
        gene_id: parsed.gene_id,
        name: parsed.name,
        description: parsed.description || '',
        traits: parsed.traits.map((t: any): GEPTrait => ({
          id: t.id,
          name: t.name,
          category: t.category || 'general',
          value: t.value ?? null,
          weight: t.weight ?? 1.0,
        })),
        behaviors: (parsed.behaviors || []).map((b: any): GEPBehavior => ({
          trigger: b.trigger || 'always',
          action: b.action,
          parameters: b.parameters || {},
          priority: b.priority ?? 0,
        })),
        compatibility: {
          can_merge_with: parsed.compatibility?.can_merge_with || [],
          preferred_partners: parsed.compatibility?.preferred_partners,
          merge_boost: parsed.compatibility?.merge_boost,
        },
        metadata: {
          created_at: parsed.metadata?.created_at || new Date().toISOString(),
          author: parsed.metadata?.author || 'unknown',
          source: parsed.metadata?.source || 'evomap',
          license: parsed.metadata?.license,
          tags: parsed.metadata?.tags || [],
        },
      };

      return { success: true, data: gene, warnings: warnings.length > 0 ? warnings : undefined };
    } catch (error) {
      return { success: false, error: `Parse error: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * 将 GEPGene 序列化为 JSON 字符串
   */
  serialize(gene: GEPGene): string {
    return JSON.stringify(gene, null, 2);
  }

  /**
   * 验证数据是否为有效的 GEP 格式
   */
  validate(data: string): boolean {
    const result = this.parse(data);
    return result.success;
  }

  /**
   * 将 GEP 格式转换为统一基因格式
   */
  toUnified(gene: GEPGene, options: Partial<UnifiedGene> = {}): UnifiedGene {
    // 计算稀有度分数 (基于 traits 的权重)
    const rarityScore = this.calculateRarityScore(gene);
    
    // 确定基因类型
    const geneType = this.inferGeneType(gene);

    // 构建统一基因
    const unified: UnifiedGene = {
      id: gene.gene_id,
      creator: gene.metadata.author,
      geneType,
      rarityScore,
      dnaHash: '', // 将在创建 payload 后计算
      createdAt: new Date(gene.metadata.created_at).getTime(),
      generation: 1,
      isActive: true,
      payload: {
        format: GeneFormat.GEP,
        encoding: 'utf-8',
        data: this.serialize(gene),
        contentHash: '', // 稍后计算
        mimeType: this.mimeType,
      },
      metadata: {
        name: gene.name,
        description: gene.description,
        traits: gene.traits,
        behaviors: gene.behaviors,
        compatibility: gene.compatibility,
        tags: gene.metadata.tags,
        source: gene.metadata.source,
      },
      ...options,
    };

    // 计算 contentHash
    unified.payload.contentHash = computeContentHashSync(unified.payload.data);
    unified.dnaHash = unified.payload.contentHash;

    return unified;
  }

  /**
   * 从统一基因格式转换为 GEP 格式
   */
  fromUnified(unified: UnifiedGene): GEPGene {
    // 如果原始数据是 GEP 格式，直接解析
    if (unified.payload.format === GeneFormat.GEP) {
      const result = this.parse(unified.payload.data);
      if (result.success) {
        return result.data!;
      }
    }

    // 否则从 metadata 重建
    const metadata = unified.metadata || {};
    
    return {
      version: '1.0',
      gene_id: String(unified.id),
      name: metadata.name || `Gene ${unified.id}`,
      description: metadata.description || '',
      traits: metadata.traits || [{
        id: 'type',
        name: 'Gene Type',
        category: 'core',
        value: GeneType[unified.geneType],
        weight: 1.0,
      }],
      behaviors: metadata.behaviors || [],
      compatibility: metadata.compatibility || { can_merge_with: [] },
      metadata: {
        created_at: new Date(unified.createdAt).toISOString(),
        author: unified.creator,
        source: 'genloop',
        tags: metadata.tags || [],
      },
    };
  }

  /**
   * 计算 GEP 基因的稀有度分数
   */
  private calculateRarityScore(gene: GEPGene): number {
    if (!gene.traits || gene.traits.length === 0) {
      return 1000; // 默认稀有度
    }

    // 基于 traits 的权重和数量计算
    const totalWeight = gene.traits.reduce((sum, t) => sum + (t.weight || 0), 0);
    const avgWeight = totalWeight / gene.traits.length;
    
    // 考虑 behaviors 的复杂度
    const behaviorBonus = Math.min((gene.behaviors?.length || 0) * 500, 2000);
    
    // 考虑兼容性设置
    const compatibilityBonus = gene.compatibility?.merge_boost 
      ? Math.floor(gene.compatibility.merge_boost * 1000) 
      : 0;

    // 计算最终分数 (0-10000)
    let score = Math.floor(avgWeight * 2000) + behaviorBonus + compatibilityBonus;
    
    // 添加基于基因名称的确定性随机因子
    const nameHash = hashString(gene.name + gene.gene_id);
    const randomFactor = parseInt(nameHash.slice(0, 8), 16) % 1000;
    score += randomFactor;

    return Math.min(Math.max(score, 100), 10000);
  }

  /**
   * 根据 GEP 内容推断基因类型
   */
  private inferGeneType(gene: GEPGene): GeneType {
    const name = gene.name.toLowerCase();
    const description = (gene.description || '').toLowerCase();
    const tags = gene.metadata.tags?.map(t => t.toLowerCase()) || [];

    // 检查关键词
    const hasAbility = ['ability', 'skill', 'power', 'capability'].some(k => 
      name.includes(k) || description.includes(k) || tags.includes(k)
    );
    const hasStrategy = ['strategy', 'plan', 'tactic', 'approach'].some(k => 
      name.includes(k) || description.includes(k) || tags.includes(k)
    );
    const hasKnowledge = ['knowledge', 'data', 'info', 'learn'].some(k => 
      name.includes(k) || description.includes(k) || tags.includes(k)
    );

    if (hasAbility && hasStrategy) return GeneType.Hybrid;
    if (hasAbility) return GeneType.Ability;
    if (hasStrategy) return GeneType.Strategy;
    if (hasKnowledge) return GeneType.Knowledge;

    // 根据 behaviors 数量判断
    if ((gene.behaviors?.length || 0) > 3) return GeneType.Strategy;
    if ((gene.traits?.length || 0) > 5) return GeneType.Knowledge;

    return GeneType.Ability;
  }
}

// 同步计算哈希 (用于 toUnified)
function computeContentHashSync(data: string): string {
  // 简单的确定性哈希，实际使用应调用异步版本
  return '0x' + hashString(data);
}

// 简单的字符串哈希函数
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // 转换为 64 字符十六进制字符串
  const hex = Math.abs(hash).toString(16).padStart(64, '0');
  return hex;
}

// 导出单例实例
export const gepParser = new GEPParser();

// 便捷函数
export function parseGEP(data: string): ParseResult<GEPGene> {
  return gepParser.parse(data);
}

export function gepToUnified(gene: GEPGene, options?: Partial<UnifiedGene>): UnifiedGene {
  return gepParser.toUnified(gene, options);
}

export function unifiedToGEP(unified: UnifiedGene): GEPGene {
  return gepParser.fromUnified(unified);
}
