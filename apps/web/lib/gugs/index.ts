/**
 * GenLoop Unified Gene Standard (GUGS) - 统一基因标准
 * 
 * GUGS 是一个跨平台、跨格式的基因数据标准，支持多种基因格式的统一表示和互操作。
 * 
 * @module gugs
 */

// 核心类型
export {
  GeneFormat,
  GeneType,
  ImportSource,
  type GenePayload,
  type UnifiedGene,
  type GEPGene,
  type GEPTrait,
  type GEPBehavior,
  type GEPCompatibility,
  type GEPMetadata,
  type SkillMDGene,
  type SkillMDTool,
  type SkillMDWorkflow,
  type SkillMDParameter,
  type SkillMDStep,
  type SkillMDConfig,
  type SkillMDMetadata,
  type ParseResult,
  type GeneParser,
  type ImportOptions,
  type ImportResult,
  type GeneDisplayInfo,
  type DisplayTrait,
  type DisplayAction,
} from './UnifiedGene';

// 工具函数
export {
  getGeneFormatLabel,
  getRarityLabel,
  getRarityColor,
  computeContentHash,
  verifyContentHash,
} from './UnifiedGene';

// GEP 解析器
export {
  GEPParser,
  gepParser,
  parseGEP,
  gepToUnified,
  unifiedToGEP,
} from './GEPParser';

// SkillMD 解析器
export {
  SkillMdParser,
  skillMdParser,
  parseSkillMD,
  skillMDToUnified,
  unifiedToSkillMD,
} from './SkillMdParser';

// 导入工具
export {
  ImportTool,
  importTool,
  autoImport,
  importFromEvoMap,
  importFromClawHub,
  detectFormat,
  toDisplayInfo,
} from './ImportTool';
