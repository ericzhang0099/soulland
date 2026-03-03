/**
 * ImportTool - 基因导入工具
 * 
 * 支持从 EvoMap、ClawHub 等平台导入基因到 GenLoop
 */

import {
  GeneFormat,
  ImportSource,
  type ImportOptions,
  type ImportResult,
  type UnifiedGene,
  type GeneDisplayInfo,
  type DisplayTrait,
  type DisplayAction,
  getGeneFormatLabel,
  getRarityLabel,
  getRarityColor,
  computeContentHash,
  verifyContentHash,
} from './UnifiedGene';

import { gepParser, parseGEP, gepToUnified } from './GEPParser';
import { skillMdParser, parseSkillMD, skillMDToUnified } from './SkillMdParser';

// 导入源配置
interface SourceConfig {
  name: string;
  baseUrl?: string;
  apiEndpoint?: string;
  supportedFormats: GeneFormat[];
}

const SOURCE_CONFIGS: Record<ImportSource, SourceConfig> = {
  [ImportSource.EvoMap]: {
    name: 'EvoMap',
    baseUrl: 'https://evomap.io',
    apiEndpoint: '/api/v1/genes',
    supportedFormats: [GeneFormat.GEP],
  },
  [ImportSource.ClawHub]: {
    name: 'ClawHub',
    baseUrl: 'https://clawhub.dev',
    apiEndpoint: '/api/skills',
    supportedFormats: [GeneFormat.SkillMD],
  },
  [ImportSource.Native]: {
    name: 'GenLoop Native',
    supportedFormats: [GeneFormat.Native],
  },
  [ImportSource.Custom]: {
    name: 'Custom Source',
    supportedFormats: [GeneFormat.Native, GeneFormat.GEP, GeneFormat.SkillMD, GeneFormat.Custom],
  },
};

export class ImportTool {
  private sourceConfigs: Record<ImportSource, SourceConfig>;

  constructor() {
    this.sourceConfigs = SOURCE_CONFIGS;
  }

  /**
   * 自动检测并导入基因数据
   */
  async autoImport(data: string, options: Partial<ImportOptions> = {}): Promise<ImportResult> {
    // 尝试检测格式
    const detectedFormat = this.detectFormat(data);
    
    if (detectedFormat === null) {
      return {
        success: false,
        error: 'Unable to detect gene format. Supported formats: GEP (JSON), SkillMD (Markdown)',
      };
    }

    // 根据检测到的格式设置来源
    const source = options.source || this.inferSourceFromFormat(detectedFormat);
    
    return this.importFromFormat(data, detectedFormat, {
      ...options,
      source,
    });
  }

  /**
   * 从 EvoMap 导入 GEP 格式基因
   */
  async importFromEvoMap(data: string, options: Partial<ImportOptions> = {}): Promise<ImportResult> {
    return this.importFromFormat(data, GeneFormat.GEP, {
      source: ImportSource.EvoMap,
      ...options,
    });
  }

  /**
   * 从 ClawHub 导入 SKILL.md 格式基因
   */
  async importFromClawHub(data: string, options: Partial<ImportOptions> = {}): Promise<ImportResult> {
    return this.importFromFormat(data, GeneFormat.SkillMD, {
      source: ImportSource.ClawHub,
      ...options,
    });
  }

  /**
   * 从特定格式导入
   */
  async importFromFormat(
    data: string, 
    format: GeneFormat, 
    options: Partial<ImportOptions> = {}
  ): Promise<ImportResult> {
    const warnings: string[] = [];

    try {
      let unified: UnifiedGene;

      switch (format) {
        case GeneFormat.GEP:
          const gepResult = parseGEP(data);
          if (!gepResult.success) {
            return { success: false, error: gepResult.error };
          }
          if (gepResult.warnings) {
            warnings.push(...gepResult.warnings);
          }
          unified = gepToUnified(gepResult.data!, {
            metadata: { importSource: options.source || ImportSource.EvoMap },
          });
          break;

        case GeneFormat.SkillMD:
          const skillResult = parseSkillMD(data);
          if (!skillResult.success) {
            return { success: false, error: skillResult.error };
          }
          if (skillResult.warnings) {
            warnings.push(...skillResult.warnings);
          }
          unified = skillMDToUnified(skillResult.data!, {
            metadata: { importSource: options.source || ImportSource.ClawHub },
          });
          break;

        case GeneFormat.Native:
          // 原生格式需要是有效的 JSON
          try {
            const native = JSON.parse(data);
            unified = {
              id: native.id || `native-${Date.now()}`,
              creator: native.creator || 'unknown',
              geneType: native.geneType || 0,
              rarityScore: native.rarityScore || 1000,
              dnaHash: native.dnaHash || '',
              createdAt: native.createdAt || Date.now(),
              generation: native.generation || 1,
              isActive: true,
              payload: {
                format: GeneFormat.Native,
                encoding: 'utf-8',
                data,
                contentHash: await computeContentHash(data),
                mimeType: 'application/json',
              },
              metadata: native.metadata,
            };
          } catch (e) {
            return { success: false, error: 'Invalid Native format: ' + (e as Error).message };
          }
          break;

        default:
          return { success: false, error: `Unsupported format: ${format}` };
      }

      // 验证内容哈希（如果提供）
      if (options.validateHash && unified.payload.contentHash) {
        const isValid = await verifyContentHash(data, unified.payload.contentHash);
        if (!isValid) {
          warnings.push('Content hash verification failed');
        }
      }

      return {
        success: true,
        gene: unified,
        originalData: options.preserveOriginal ? data : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

    } catch (error) {
      return {
        success: false,
        error: `Import failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 从 URL 获取并导入基因
   */
  async importFromUrl(url: string, options: Partial<ImportOptions> = {}): Promise<ImportResult> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, error: `HTTP error: ${response.status}` };
      }

      const data = await response.text();
      return this.autoImport(data, options);

    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch from URL: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 批量导入基因
   */
  async batchImport(items: Array<{ data: string; options?: Partial<ImportOptions> }>): Promise<ImportResult[]> {
    return Promise.all(
      items.map(item => this.autoImport(item.data, item.options))
    );
  }

  /**
   * 检测数据格式
   */
  detectFormat(data: string): GeneFormat | null {
    const trimmed = data.trim();

    // 尝试解析为 JSON (GEP)
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        // 检查是否有 GEP 特征字段
        if (parsed.gene_id && parsed.traits && Array.isArray(parsed.traits)) {
          return GeneFormat.GEP;
        }
        // 可能是原生格式
        if (parsed.id && (parsed.geneType !== undefined || parsed.payload)) {
          return GeneFormat.Native;
        }
      } catch {
        // 不是有效的 JSON
      }
    }

    // 检查是否为 Markdown (SkillMD)
    if (trimmed.startsWith('#') && trimmed.includes('## Tools')) {
      return GeneFormat.SkillMD;
    }

    // 检查 YAML frontmatter + Markdown
    if (trimmed.startsWith('---') && trimmed.includes('#')) {
      return GeneFormat.SkillMD;
    }

    return null;
  }

  /**
   * 获取支持的导入源列表
   */
  getSupportedSources(): Array<{ id: ImportSource; name: string; formats: GeneFormat[] }> {
    return Object.entries(this.sourceConfigs).map(([id, config]) => ({
      id: id as ImportSource,
      name: config.name,
      formats: config.supportedFormats,
    }));
  }

  /**
   * 获取导入源的 API 端点
   */
  getSourceApiEndpoint(source: ImportSource, path?: string): string | undefined {
    const config = this.sourceConfigs[source];
    if (!config.baseUrl || !config.apiEndpoint) return undefined;
    
    return `${config.baseUrl}${config.apiEndpoint}${path || ''}`;
  }

  /**
   * 将统一基因转换为显示信息
   */
  toDisplayInfo(gene: UnifiedGene): GeneDisplayInfo {
    const formatLabel = getGeneFormatLabel(gene.payload.format);
    const rarityLabel = getRarityLabel(gene.rarityScore);
    const metadata = gene.metadata || {};

    // 构建 traits 显示
    const traits: DisplayTrait[] = [
      { name: 'Format', value: formatLabel, icon: '📄' },
      { name: 'Rarity', value: `${rarityLabel} (${gene.rarityScore})`, icon: '💎', color: getRarityColor(gene.rarityScore) },
      { name: 'Generation', value: gene.generation, icon: '🧬' },
      { name: 'Type', value: this.getGeneTypeLabel(gene.geneType), icon: '🏷️' },
    ];

    // 添加格式特定的 traits
    if (gene.payload.format === GeneFormat.GEP) {
      const gepTraits = metadata.traits || [];
      for (const trait of gepTraits.slice(0, 3)) {
        traits.push({
          name: trait.name,
          value: trait.value ?? trait.weight,
          icon: this.getTraitIcon(trait.category),
        });
      }
    } else if (gene.payload.format === GeneFormat.SkillMD) {
      const tools = metadata.tools || [];
      if (tools.length > 0) {
        traits.push({ name: 'Tools', value: tools.length, icon: '🛠️' });
      }
      const workflows = metadata.workflows || [];
      if (workflows.length > 0) {
        traits.push({ name: 'Workflows', value: workflows.length, icon: '⚡' });
      }
    }

    // 构建可用操作
    const actions: DisplayAction[] = [
      { id: 'view', label: 'View Details', icon: '👁️' },
      { id: 'merge', label: 'Merge', icon: '🔄' },
      { id: 'share', label: 'Share', icon: '🔗' },
    ];

    if (gene.isActive) {
      actions.push({ id: 'deactivate', label: 'Deactivate', icon: '⏸️' });
    } else {
      actions.push({ id: 'activate', label: 'Activate', icon: '▶️' });
    }

    return {
      id: String(gene.id),
      name: metadata.name || `Gene ${gene.id}`,
      description: metadata.description || '',
      format: gene.payload.format,
      formatLabel,
      rarityScore: gene.rarityScore,
      rarityLabel,
      creator: gene.creator,
      createdAt: new Date(gene.createdAt).toLocaleString(),
      generation: gene.generation,
      traits,
      actions,
      rawPayload: gene.payload,
    };
  }

  /**
   * 验证导入的基因是否完整
   */
  validateImport(gene: UnifiedGene): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!gene.id) {
      errors.push('Missing gene ID');
    }

    if (!gene.creator) {
      errors.push('Missing creator address');
    }

    if (gene.rarityScore < 0 || gene.rarityScore > 10000) {
      errors.push('Invalid rarity score (must be 0-10000)');
    }

    if (!gene.payload || !gene.payload.data) {
      errors.push('Missing payload data');
    }

    if (!gene.payload.contentHash) {
      errors.push('Missing content hash');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // 私有辅助方法

  private inferSourceFromFormat(format: GeneFormat): ImportSource {
    switch (format) {
      case GeneFormat.GEP:
        return ImportSource.EvoMap;
      case GeneFormat.SkillMD:
        return ImportSource.ClawHub;
      case GeneFormat.Native:
        return ImportSource.Native;
      default:
        return ImportSource.Custom;
    }
  }

  private getGeneTypeLabel(type: number): string {
    const labels = ['Ability', 'Strategy', 'Knowledge', 'Hybrid'];
    return labels[type] || 'Unknown';
  }

  private getTraitIcon(category: string): string {
    const icons: Record<string, string> = {
      core: '🔵',
      ability: '⚡',
      skill: '🎯',
      knowledge: '📚',
      behavior: '🎭',
      general: '📋',
    };
    return icons[category] || '📋';
  }
}

// 导出单例实例
export const importTool = new ImportTool();

// 便捷函数
export function autoImport(data: string, options?: Partial<ImportOptions>): Promise<ImportResult> {
  return importTool.autoImport(data, options);
}

export function importFromEvoMap(data: string, options?: Partial<ImportOptions>): Promise<ImportResult> {
  return importTool.importFromEvoMap(data, options);
}

export function importFromClawHub(data: string, options?: Partial<ImportOptions>): Promise<ImportResult> {
  return importTool.importFromClawHub(data, options);
}

export function detectFormat(data: string): GeneFormat | null {
  return importTool.detectFormat(data);
}

export function toDisplayInfo(gene: UnifiedGene): GeneDisplayInfo {
  return importTool.toDisplayInfo(gene);
}

// 重新导出类型
export type { ImportOptions, ImportResult, ImportSource };
