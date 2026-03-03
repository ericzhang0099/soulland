/**
 * GenLoop Unified Gene Standard (GUGS) - 统一基因标准
 * 
 * GUGS 是一个跨平台、跨格式的基因数据标准，支持多种基因格式的统一表示和互操作。
 */

// 基因格式类型
export enum GeneFormat {
  Native = 0,   // 原生 GenLoop 格式
  GEP = 1,      // EvoMap GEP 格式 (JSON)
  SkillMD = 2,  // ClawHub SKILL.md 格式
  Custom = 3,   // 自定义格式
}

// 基因载荷接口
export interface GenePayload {
  format: GeneFormat;      // 格式类型
  encoding: string;        // 编码方式 (utf-8, base64, etc.)
  data: string;            // 原始数据内容
  contentHash: string;     // 内容哈希 (验证完整性)
  mimeType: string;        // MIME 类型
}

// 基因类型
export enum GeneType {
  Ability = 0,    // 能力型基因
  Strategy = 1,   // 策略型基因
  Knowledge = 2,  // 知识型基因
  Hybrid = 3,     // 混合型基因
}

// 统一基因接口 - GUGS 核心
export interface UnifiedGene {
  // 基础信息
  id: string | number;           // 基因唯一标识
  creator: string;               // 创建者地址
  geneType: GeneType;            // 基因类型
  rarityScore: number;           // 稀有度分数 (0-10000)
  dnaHash: string;               // DNA 哈希
  createdAt: number;             // 创建时间戳
  
  // 谱系信息
  parentA?: string | number;     // 父本 A
  parentB?: string | number;     // 父本 B
  generation: number;            // 世代
  
  // GUGS 核心: 多格式载荷
  payload: GenePayload;
  
  // 元数据
  isActive: boolean;
  metadata?: Record<string, any>; // 解析后的元数据缓存
}

// GEP (Gene Expression Profile) 格式 - EvoMap 标准
export interface GEPGene {
  version: string;
  gene_id: string;
  name: string;
  description?: string;
  traits: GEPTrait[];
  behaviors: GEPBehavior[];
  compatibility: GEPCompatibility;
  metadata: GEPMetadata;
}

export interface GEPTrait {
  id: string;
  name: string;
  category: string;
  value: number | string | boolean;
  weight: number;
}

export interface GEPBehavior {
  trigger: string;
  action: string;
  parameters?: Record<string, any>;
  priority: number;
}

export interface GEPCompatibility {
  can_merge_with: string[];
  preferred_partners?: string[];
  merge_boost?: number;
}

export interface GEPMetadata {
  created_at: string;
  author: string;
  source: string;
  license?: string;
  tags?: string[];
}

// SkillMD 格式 - ClawHub 标准
export interface SkillMDGene {
  name: string;
  description: string;
  version: string;
  tools: SkillMDTool[];
  workflows: SkillMDWorkflow[];
  config?: SkillMDConfig;
  metadata?: SkillMDMetadata;
}

export interface SkillMDTool {
  name: string;
  description?: string;
  parameters?: SkillMDParameter[];
  returns?: string;
}

export interface SkillMDParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: any;
}

export interface SkillMDWorkflow {
  name: string;
  steps: SkillMDStep[];
  description?: string;
}

export interface SkillMDStep {
  tool: string;
  input: Record<string, any>;
  output?: string;
  condition?: string;
}

export interface SkillMDConfig {
  timeout?: number;
  retry?: number;
  parallel?: boolean;
  [key: string]: any;
}

export interface SkillMDMetadata {
  author?: string;
  created?: string;
  updated?: string;
  tags?: string[];
  category?: string;
}

// 解析结果
export interface ParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// 基因转换器接口
export interface GeneParser<T = any> {
  format: GeneFormat;
  mimeType: string;
  
  // 解析原始数据为特定格式
  parse(data: string): ParseResult<T>;
  
  // 将特定格式序列化为字符串
  serialize(gene: T): string;
  
  // 转换为统一基因格式
  toUnified(gene: T, options?: Partial<UnifiedGene>): UnifiedGene;
  
  // 从统一基因格式转换
  fromUnified(unified: UnifiedGene): T;
  
  // 验证数据格式
  validate(data: string): boolean;
}

// 导入来源
export enum ImportSource {
  EvoMap = 'evomap',
  ClawHub = 'clawhub',
  Native = 'native',
  Custom = 'custom',
}

// 导入选项
export interface ImportOptions {
  source: ImportSource;
  validateHash?: boolean;      // 验证内容哈希
  autoConvert?: boolean;       // 自动转换为统一格式
  preserveOriginal?: boolean;  // 保留原始数据
  metadata?: Record<string, any>;
}

// 导入结果
export interface ImportResult {
  success: boolean;
  gene?: UnifiedGene;
  originalData?: string;
  error?: string;
  warnings?: string[];
}

// 基因显示信息
export interface GeneDisplayInfo {
  id: string;
  name: string;
  description: string;
  format: GeneFormat;
  formatLabel: string;
  rarityScore: number;
  rarityLabel: string;
  creator: string;
  createdAt: string;
  generation: number;
  traits: DisplayTrait[];
  actions: DisplayAction[];
  rawPayload: GenePayload;
}

export interface DisplayTrait {
  name: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export interface DisplayAction {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  handler?: () => void;
}

// 工具函数
export function getGeneFormatLabel(format: GeneFormat): string {
  switch (format) {
    case GeneFormat.Native:
      return 'GenLoop Native';
    case GeneFormat.GEP:
      return 'EvoMap GEP';
    case GeneFormat.SkillMD:
      return 'ClawHub Skill';
    case GeneFormat.Custom:
      return 'Custom';
    default:
      return 'Unknown';
  }
}

export function getRarityLabel(score: number): string {
  if (score >= 9000) return 'Legendary';
  if (score >= 7000) return 'Epic';
  if (score >= 5000) return 'Rare';
  if (score >= 3000) return 'Uncommon';
  return 'Common';
}

export function getRarityColor(score: number): string {
  if (score >= 9000) return '#FFD700'; // Gold
  if (score >= 7000) return '#FF69B4'; // Hot Pink
  if (score >= 5000) return '#4169E1'; // Royal Blue
  if (score >= 3000) return '#32CD32'; // Lime Green
  return '#808080'; // Gray
}

// 计算内容哈希
export async function computeContentHash(data: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto) {
    // 浏览器环境
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js 环境
    const crypto = await import('crypto');
    return '0x' + crypto.createHash('sha256').update(data).digest('hex');
  }
}

// 验证内容哈希
export async function verifyContentHash(data: string, expectedHash: string): Promise<boolean> {
  const actualHash = await computeContentHash(data);
  return actualHash.toLowerCase() === expectedHash.toLowerCase();
}
