'use client';

import React, { useState } from 'react';
import {
  GeneFormat,
  type GeneDisplayInfo,
  type DisplayTrait,
  getRarityColor,
  getGeneFormatLabel,
} from '@/lib/gugs';

interface GeneCardProps {
  gene: GeneDisplayInfo;
  onAction?: (actionId: string, gene: GeneDisplayInfo) => void;
  showRawData?: boolean;
  className?: string;
}

/**
 * 基因卡片组件 - 支持多格式基因显示
 */
export function GeneCard({ gene, onAction, showRawData = false, className = '' }: GeneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  const handleAction = (actionId: string) => {
    onAction?.(actionId, gene);
  };

  // 格式图标
  const getFormatIcon = (format: GeneFormat) => {
    switch (format) {
      case GeneFormat.GEP:
        return '🧬';
      case GeneFormat.SkillMD:
        return '📝';
      case GeneFormat.Native:
        return '🔵';
      case GeneFormat.Custom:
        return '⚙️';
      default:
        return '📄';
    }
  };

  // 格式颜色
  const getFormatColor = (format: GeneFormat) => {
    switch (format) {
      case GeneFormat.GEP:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case GeneFormat.SkillMD:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case GeneFormat.Native:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case GeneFormat.Custom:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className={`bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{getFormatIcon(gene.format)}</span>
              <h3 className="font-bold text-lg text-white truncate">{gene.name}</h3>
            </div>
            <p className="text-gray-400 text-sm line-clamp-2">{gene.description || 'No description'}</p>
          </div>
          
          {/* 格式标签 */}
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getFormatColor(gene.format)}`}>
            {gene.formatLabel}
          </span>
        </div>

        {/* 稀有度条 */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Rarity</span>
            <span className="font-medium" style={{ color: getRarityColor(gene.rarityScore) }}>
              {gene.rarityLabel}
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(gene.rarityScore / 10000) * 100}%`,
                backgroundColor: getRarityColor(gene.rarityScore),
              }}
            />
          </div>
        </div>
      </div>

      {/* Traits */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {gene.traits.slice(0, isExpanded ? undefined : 4).map((trait, index) => (
            <TraitBadge key={index} trait={trait} />
          ))}
        </div>
        
        {gene.traits.length > 4 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition"
          >
            {isExpanded ? 'Show less' : `+${gene.traits.length - 4} more`}
          </button>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {gene.actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              disabled={action.disabled}
              className={`px-3 py-1.5 text-sm rounded-lg border transition flex items-center gap-1.5 ${
                action.disabled
                  ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white'
              }`}
            >
              {action.icon && <span>{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* 原始数据展示 */}
      {showRawData && (
        <div className="border-t border-white/10">
          <button
            onClick={() => setShowPayload(!showPayload)}
            className="w-full px-4 py-2 text-xs text-gray-500 hover:text-gray-300 transition flex items-center justify-between"
          >
            <span>{showPayload ? 'Hide' : 'Show'} Raw Payload</span>
            <svg
              className={`w-4 h-4 transition-transform ${showPayload ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showPayload && (
            <div className="px-4 pb-4">
              <pre className="bg-black/50 rounded-lg p-3 text-xs text-gray-400 overflow-auto max-h-60">
                {JSON.stringify(gene.rawPayload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Trait 徽章组件
 */
function TraitBadge({ trait }: { trait: DisplayTrait }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg text-xs">
      {trait.icon && <span>{trait.icon}</span>}
      <span className="text-gray-400 truncate">{trait.name}:</span>
      <span 
        className="font-medium truncate"
        style={{ color: trait.color || 'inherit' }}
      >
        {trait.value}
      </span>
    </div>
  );
}

/**
 * 基因列表组件
 */
interface GeneListProps {
  genes: GeneDisplayInfo[];
  onAction?: (actionId: string, gene: GeneDisplayInfo) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function GeneList({ 
  genes, 
  onAction, 
  loading = false, 
  emptyMessage = 'No genes found' 
}: GeneListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900/50 border border-white/10 rounded-xl p-4 animate-pulse">
            <div className="h-6 bg-gray-800 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-800 rounded w-full mb-4"></div>
            <div className="h-2 bg-gray-800 rounded w-full mb-4"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 bg-gray-800 rounded"></div>
              <div className="h-8 bg-gray-800 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (genes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🧬</div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {genes.map((gene) => (
        <GeneCard 
          key={gene.id} 
          gene={gene} 
          onAction={onAction}
          showRawData={true}
        />
      ))}
    </div>
  );
}

/**
 * 格式过滤器组件
 */
interface FormatFilterProps {
  selected: GeneFormat | 'all';
  onChange: (format: GeneFormat | 'all') => void;
}

export function FormatFilter({ selected, onChange }: FormatFilterProps) {
  const formats: Array<{ value: GeneFormat | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'All Formats', icon: '📋' },
    { value: GeneFormat.Native, label: 'Native', icon: '🔵' },
    { value: GeneFormat.GEP, label: 'GEP', icon: '🧬' },
    { value: GeneFormat.SkillMD, label: 'SkillMD', icon: '📝' },
    { value: GeneFormat.Custom, label: 'Custom', icon: '⚙️' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {formats.map((format) => (
        <button
          key={format.value}
          onClick={() => onChange(format.value)}
          className={`px-3 py-1.5 text-sm rounded-lg border transition flex items-center gap-1.5 ${
            selected === format.value
              ? 'bg-primary-600 border-primary-500 text-white'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <span>{format.icon}</span>
          {format.label}
        </button>
      ))}
    </div>
  );
}

export default GeneCard;
