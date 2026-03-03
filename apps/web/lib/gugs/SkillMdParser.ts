/**
 * SkillMdParser - ClawHub SKILL.md 格式解析器
 * 
 * SKILL.md 是 ClawHub 平台使用的 Markdown 格式技能/基因定义标准
 */

import {
  GeneFormat,
  GeneType,
  type GeneParser,
  type ParseResult,
  type UnifiedGene,
  type SkillMDGene,
  type SkillMDTool,
  type SkillMDWorkflow,
  type SkillMDParameter,
  type SkillMDStep,
  type SkillMDConfig,
  type SkillMDMetadata,
} from './UnifiedGene';

export class SkillMdParser implements GeneParser<SkillMDGene> {
  readonly format = GeneFormat.SkillMD;
  readonly mimeType = 'text/markdown';

  /**
   * 解析 SKILL.md 格式的字符串
   */
  parse(data: string): ParseResult<SkillMDGene> {
    try {
      const warnings: string[] = [];
      
      // 解析头部元数据
      const metadata = this.parseMetadata(data);
      
      // 解析工具定义
      const tools = this.parseTools(data);
      if (tools.length === 0) {
        warnings.push('No tools defined in SKILL.md');
      }

      // 解析工作流
      const workflows = this.parseWorkflows(data);

      // 解析配置
      const config = this.parseConfig(data);

      // 提取名称和描述
      const name = metadata.name || this.extractTitle(data) || 'Unnamed Skill';
      const description = metadata.description || this.extractDescription(data) || '';

      const gene: SkillMDGene = {
        name,
        description,
        version: metadata.version || '1.0.0',
        tools,
        workflows,
        config,
        metadata: {
          author: metadata.author,
          created: metadata.created,
          updated: metadata.updated,
          tags: metadata.tags || [],
          category: metadata.category,
        },
      };

      return { success: true, data: gene, warnings: warnings.length > 0 ? warnings : undefined };
    } catch (error) {
      return { success: false, error: `Parse error: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * 将 SkillMDGene 序列化为 Markdown 字符串
   */
  serialize(gene: SkillMDGene): string {
    const lines: string[] = [];

    // 标题
    lines.push(`# ${gene.name}`);
    lines.push('');

    // 描述
    if (gene.description) {
      lines.push(gene.description);
      lines.push('');
    }

    // 元数据
    lines.push('## Metadata');
    lines.push('');
    lines.push(`- **Version**: ${gene.version}`);
    if (gene.metadata?.author) {
      lines.push(`- **Author**: ${gene.metadata.author}`);
    }
    if (gene.metadata?.category) {
      lines.push(`- **Category**: ${gene.metadata.category}`);
    }
    if (gene.metadata?.tags?.length) {
      lines.push(`- **Tags**: ${gene.metadata.tags.join(', ')}`);
    }
    lines.push('');

    // 工具
    if (gene.tools.length > 0) {
      lines.push('## Tools');
      lines.push('');
      
      for (const tool of gene.tools) {
        lines.push(`### ${tool.name}`);
        if (tool.description) {
          lines.push(tool.description);
          lines.push('');
        }
        
        if (tool.parameters && tool.parameters.length > 0) {
          lines.push('**Parameters:**');
          lines.push('');
          for (const param of tool.parameters) {
            const req = param.required ? '(required)' : '(optional)';
            lines.push(`- \`${param.name}\` \`${param.type}\` ${req}: ${param.description || ''}`);
            if (param.default !== undefined) {
              lines.push(`  - Default: \`${JSON.stringify(param.default)}\``);
            }
          }
          lines.push('');
        }

        if (tool.returns) {
          lines.push(`**Returns**: ${tool.returns}`);
          lines.push('');
        }
      }
    }

    // 工作流
    if (gene.workflows.length > 0) {
      lines.push('## Workflows');
      lines.push('');
      
      for (const workflow of gene.workflows) {
        lines.push(`### ${workflow.name}`);
        if (workflow.description) {
          lines.push(workflow.description);
          lines.push('');
        }
        
        lines.push('**Steps:**');
        lines.push('');
        for (let i = 0; i < workflow.steps.length; i++) {
          const step = workflow.steps[i];
          lines.push(`${i + 1}. **${step.tool}**`);
          if (step.condition) {
            lines.push(`   - Condition: \`${step.condition}\``);
          }
          lines.push(`   - Input: \`${JSON.stringify(step.input)}\``);
          if (step.output) {
            lines.push(`   - Output: \`${step.output}\``);
          }
        }
        lines.push('');
      }
    }

    // 配置
    if (gene.config && Object.keys(gene.config).length > 0) {
      lines.push('## Config');
      lines.push('');
      lines.push('```yaml');
      lines.push(JSON.stringify(gene.config, null, 2));
      lines.push('```');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 验证数据是否为有效的 SKILL.md 格式
   */
  validate(data: string): boolean {
    // 检查基本的 Markdown 结构
    const hasTitle = /^#\s+.+$/m.test(data);
    const hasTools = /##\s*Tools/i.test(data);
    
    return hasTitle && hasTools;
  }

  /**
   * 将 SkillMD 格式转换为统一基因格式
   */
  toUnified(gene: SkillMDGene, options: Partial<UnifiedGene> = {}): UnifiedGene {
    // 计算稀有度分数
    const rarityScore = this.calculateRarityScore(gene);
    
    // 确定基因类型
    const geneType = this.inferGeneType(gene);

    // 构建统一基因
    const unified: UnifiedGene = {
      id: this.generateGeneId(gene),
      creator: gene.metadata?.author || 'unknown',
      geneType,
      rarityScore,
      dnaHash: '',
      createdAt: gene.metadata?.created 
        ? new Date(gene.metadata.created).getTime() 
        : Date.now(),
      generation: 1,
      isActive: true,
      payload: {
        format: GeneFormat.SkillMD,
        encoding: 'utf-8',
        data: this.serialize(gene),
        contentHash: '',
        mimeType: this.mimeType,
      },
      metadata: {
        name: gene.name,
        description: gene.description,
        version: gene.version,
        tools: gene.tools,
        workflows: gene.workflows,
        config: gene.config,
        tags: gene.metadata?.tags,
        category: gene.metadata?.category,
      },
      ...options,
    };

    // 计算 contentHash
    unified.payload.contentHash = computeContentHashSync(unified.payload.data);
    unified.dnaHash = unified.payload.contentHash;

    return unified;
  }

  /**
   * 从统一基因格式转换为 SkillMD 格式
   */
  fromUnified(unified: UnifiedGene): SkillMDGene {
    // 如果原始数据是 SkillMD 格式，直接解析
    if (unified.payload.format === GeneFormat.SkillMD) {
      const result = this.parse(unified.payload.data);
      if (result.success) {
        return result.data!;
      }
    }

    // 否则从 metadata 重建
    const metadata = unified.metadata || {};
    
    return {
      name: metadata.name || `Gene ${unified.id}`,
      description: metadata.description || '',
      version: metadata.version || '1.0.0',
      tools: metadata.tools || [],
      workflows: metadata.workflows || [],
      config: metadata.config,
      metadata: {
        author: unified.creator,
        created: new Date(unified.createdAt).toISOString(),
        tags: metadata.tags || [],
        category: metadata.category,
      },
    };
  }

  // 私有辅助方法

  private parseMetadata(data: string): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    // 尝试解析 YAML frontmatter
    const frontmatterMatch = data.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (frontmatterMatch) {
      const yaml = frontmatterMatch[1];
      for (const line of yaml.split('\n')) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          const [, key, value] = match;
          metadata[key] = value.trim().replace(/^["']|["']$/g, '');
        }
      }
    }

    return metadata;
  }

  private parseTools(data: string): SkillMDTool[] {
    const tools: SkillMDTool[] = [];
    
    // 匹配 Tools 部分
    const toolsMatch = data.match(/##\s*Tools\s*\n([\s\S]*?)(?=##|$)/i);
    if (!toolsMatch) return tools;

    const toolsSection = toolsMatch[1];
    
    // 匹配每个工具 (### 开头)
    const toolRegex = /###\s+(.+)\n([\s\S]*?)(?=###|##|$)/g;
    let match;
    
    while ((match = toolRegex.exec(toolsSection)) !== null) {
      const name = match[1].trim();
      const content = match[2];
      
      const tool: SkillMDTool = {
        name,
        description: this.extractSectionContent(content, 'description') || undefined,
        parameters: this.parseParameters(content),
        returns: this.extractReturnType(content),
      };
      
      tools.push(tool);
    }

    return tools;
  }

  private parseParameters(content: string): SkillMDParameter[] {
    const params: SkillMDParameter[] = [];
    
    // 匹配 Parameters 部分
    const paramsMatch = content.match(/\*\*Parameters:\*\*\s*\n([\s\S]*?)(?=\*\*|$)/i);
    if (!paramsMatch) return params;

    const paramsSection = paramsMatch[1];
    
    // 匹配每个参数
    const paramRegex = /-\s+`([^`]+)`\s+`([^`]+)`\s*(\(required\)|\(optional\))?\s*:?\s*(.*)/g;
    let match;
    
    while ((match = paramRegex.exec(paramsSection)) !== null) {
      params.push({
        name: match[1].trim(),
        type: match[2].trim(),
        required: match[3]?.includes('required') || false,
        description: match[4]?.trim() || undefined,
      });
    }

    return params;
  }

  private parseWorkflows(data: string): SkillMDWorkflow[] {
    const workflows: SkillMDWorkflow[] = [];
    
    // 匹配 Workflows 部分
    const workflowsMatch = data.match(/##\s*Workflows\s*\n([\s\S]*?)(?=##|$)/i);
    if (!workflowsMatch) return workflows;

    const workflowsSection = workflowsMatch[1];
    
    // 匹配每个工作流
    const workflowRegex = /###\s+(.+)\n([\s\S]*?)(?=###|##|$)/g;
    let match;
    
    while ((match = workflowRegex.exec(workflowsSection)) !== null) {
      const name = match[1].trim();
      const content = match[2];
      
      const workflow: SkillMDWorkflow = {
        name,
        description: this.extractSectionContent(content, 'description') || undefined,
        steps: this.parseSteps(content),
      };
      
      workflows.push(workflow);
    }

    return workflows;
  }

  private parseSteps(content: string): SkillMDStep[] {
    const steps: SkillMDStep[] = [];
    
    // 匹配 Steps 列表
    const stepsMatch = content.match(/\*\*Steps:\*\*\s*\n([\s\S]*?)(?=\*\*|$)/i);
    if (!stepsMatch) return steps;

    const stepsSection = stepsMatch[1];
    
    // 匹配每个步骤 (数字开头)
    const stepRegex = /(\d+)\.\s*\*\*(.+?)\*\*\s*\n([\s\S]*?)(?=\d+\.\s*\*\*|$)/g;
    let match;
    
    while ((match = stepRegex.exec(stepsSection)) !== null) {
      const stepContent = match[3];
      
      const step: SkillMDStep = {
        tool: match[2].trim(),
        input: this.parseStepInput(stepContent),
      };

      // 提取条件
      const conditionMatch = stepContent.match(/Condition:\s*`(.+?)`/);
      if (conditionMatch) {
        step.condition = conditionMatch[1];
      }

      // 提取输出
      const outputMatch = stepContent.match(/Output:\s*`(.+?)`/);
      if (outputMatch) {
        step.output = outputMatch[1];
      }
      
      steps.push(step);
    }

    return steps;
  }

  private parseStepInput(content: string): Record<string, any> {
    const inputMatch = content.match(/Input:\s*`(.+?)`/);
    if (inputMatch) {
      try {
        return JSON.parse(inputMatch[1]);
      } catch {
        return { raw: inputMatch[1] };
      }
    }
    return {};
  }

  private parseConfig(data: string): SkillMDConfig | undefined {
    const configMatch = data.match(/##\s*Config\s*\n```(?:yaml|json)?\s*\n([\s\S]*?)```/i);
    if (configMatch) {
      try {
        return JSON.parse(configMatch[1]);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private extractTitle(data: string): string | null {
    const match = data.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : null;
  }

  private extractDescription(data: string): string | null {
    const titleMatch = data.match(/^#\s+.+$/m);
    if (!titleMatch) return null;
    
    const afterTitle = data.slice(titleMatch.index! + titleMatch[0].length);
    const nextHeading = afterTitle.match(/^##\s+/m);
    
    const desc = nextHeading 
      ? afterTitle.slice(0, nextHeading.index).trim()
      : afterTitle.trim();
    
    return desc || null;
  }

  private extractSectionContent(content: string, section: string): string | null {
    // 提取描述（第一个段落）
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length > 0 && !lines[0].startsWith('**') && !lines[0].startsWith('###')) {
      return lines[0].trim();
    }
    return null;
  }

  private extractReturnType(content: string): string | undefined {
    const match = content.match(/\*\*Returns\*\*:\s*(.+)/i);
    return match ? match[1].trim() : undefined;
  }

  private calculateRarityScore(gene: SkillMDGene): number {
    let score = 1000; // 基础分

    // 工具数量加分
    score += Math.min(gene.tools.length * 800, 3000);

    // 参数复杂度加分
    const totalParams = gene.tools.reduce((sum, t) => sum + (t.parameters?.length || 0), 0);
    score += Math.min(totalParams * 300, 2000);

    // 工作流复杂度加分
    score += Math.min(gene.workflows.length * 1000, 2000);
    const totalSteps = gene.workflows.reduce((sum, w) => sum + w.steps.length, 0);
    score += Math.min(totalSteps * 200, 1500);

    // 配置加分
    if (gene.config) {
      score += Math.min(Object.keys(gene.config).length * 200, 1000);
    }

    // 标签加分
    score += Math.min((gene.metadata?.tags?.length || 0) * 100, 500);

    return Math.min(score, 10000);
  }

  private inferGeneType(gene: SkillMDGene): GeneType {
    const name = gene.name.toLowerCase();
    const category = (gene.metadata?.category || '').toLowerCase();
    const tags = gene.metadata?.tags?.map(t => t.toLowerCase()) || [];

    // 检查关键词
    const hasAbility = ['tool', 'action', 'execute', 'run'].some(k => 
      name.includes(k) || category.includes(k) || tags.includes(k)
    );
    const hasStrategy = ['workflow', 'strategy', 'plan', 'sequence'].some(k => 
      name.includes(k) || category.includes(k) || tags.includes(k)
    );
    const hasKnowledge = ['skill', 'knowledge', 'learn', 'data'].some(k => 
      name.includes(k) || category.includes(k) || tags.includes(k)
    );

    if ((hasAbility && hasStrategy) || gene.workflows.length > 2) {
      return GeneType.Hybrid;
    }
    if (hasStrategy || gene.workflows.length > 0) return GeneType.Strategy;
    if (hasAbility || gene.tools.length > 2) return GeneType.Ability;
    if (hasKnowledge) return GeneType.Knowledge;

    return GeneType.Ability;
  }

  private generateGeneId(gene: SkillMDGene): string {
    // 基于名称和版本生成确定性 ID
    const hash = hashString(gene.name + gene.version);
    return `skill-${hash.slice(0, 16)}`;
  }
}

// 同步计算哈希
function computeContentHashSync(data: string): string {
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
  return Math.abs(hash).toString(16).padStart(64, '0');
}

// 导出单例实例
export const skillMdParser = new SkillMdParser();

// 便捷函数
export function parseSkillMD(data: string): ParseResult<SkillMDGene> {
  return skillMdParser.parse(data);
}

export function skillMDToUnified(gene: SkillMDGene, options?: Partial<UnifiedGene>): UnifiedGene {
  return skillMdParser.toUnified(gene, options);
}

export function unifiedToSkillMD(unified: UnifiedGene): SkillMDGene {
  return skillMdParser.fromUnified(unified);
}
