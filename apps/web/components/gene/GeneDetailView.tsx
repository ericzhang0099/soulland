'use client';

import React, { useState } from 'react';
import {
  GeneFormat,
  type UnifiedGene,
  type GeneDisplayInfo,
  toDisplayInfo,
} from '@/lib/gugs';

interface GeneDetailViewProps {
  gene: UnifiedGene;
  onClose?: () => void;
  onMerge?: (gene: UnifiedGene) => void;
  onShare?: (gene: UnifiedGene) => void;
  className?: string;
}

/**
 * 基因详情视图 - 显示多格式基因的详细信息
 */
export function GeneDetailView({ 
  gene, 
  onClose, 
  onMerge, 
  onShare,
  className = '' 
}: GeneDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'payload' | 'metadata' | 'raw'>('overview');
  const displayInfo = toDisplayInfo(gene);

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
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case GeneFormat.SkillMD:
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case GeneFormat.Native:
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case GeneFormat.Custom:
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className={`bg-gray-900 border border-white/10 rounded-2xl overflow-hidden ${className}`}>
      {/* 头部 */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{getFormatIcon(gene.payload.format)}</span>
              <h2 className="text-2xl font-bold text-white">{displayInfo.name}</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getFormatColor(gene.payload.format)}`}>
                {displayInfo.formatLabel}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-gray-400">
                Gen {gene.generation}
              </span>
              {gene.parentA && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-gray-400">
                  Has Parents
                </span>
              )}
              {!gene.isActive && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  Inactive
                </span>
              )}
            </div>

            <p className="text-gray-400">{displayInfo.description || 'No description available'}</p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onMerge?.(gene)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            🔄 Merge
          </button>
          <button
            onClick={() => onShare?.(gene)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            🔗 Share
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="border-b border-white/10">
        <div className="flex">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'payload', label: 'Payload', icon: '📦' },
            { id: 'metadata', label: 'Metadata', icon: '📋' },
            { id: 'raw', label: 'Raw Data', icon: '🔧' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'text-primary-400 border-b-2 border-primary-400 bg-primary-400/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab gene={gene} displayInfo={displayInfo} />
        )}
        {activeTab === 'payload' && (
          <PayloadTab payload={gene.payload} />
        )}
        {activeTab === 'metadata' && (
          <MetadataTab metadata={gene.metadata} />
        )}
        {activeTab === 'raw' && (
          <RawDataTab gene={gene} />
        )}
      </div>
    </div>
  );
}

/**
 * 概览标签页
 */
function OverviewTab({ gene, displayInfo }: { gene: UnifiedGene; displayInfo: GeneDisplayInfo }) {
  return (
    <div className="space-y-6">
      {/* 稀有度 */}
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-2">Rarity</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(gene.rarityScore / 10000) * 100}%`,
                  backgroundColor: displayInfo.traits.find(t => t.name === 'Rarity')?.color || '#808080',
                }}
              />
            </div>
          </div>
          <span className="text-lg font-bold" style={{ color: displayInfo.traits.find(t => t.name === 'Rarity')?.color }}>
            {displayInfo.rarityLabel}
          </span>
          <span className="text-gray-500">({gene.rarityScore}/10000)</span>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="ID" value={String(gene.id)} />
        <InfoItem label="Creator" value={formatAddress(gene.creator)} />
        <InfoItem label="Type" value={displayInfo.traits.find(t => t.name === 'Type')?.value as string} />
        <InfoItem label="Generation" value={`Gen ${gene.generation}`} />
        <InfoItem label="Created" value={new Date(gene.createdAt).toLocaleString()} />
        <InfoItem label="Status" value={gene.isActive ? 'Active ✅' : 'Inactive ❌'} />
      </div>

      {/* 谱系 */}
      {(gene.parentA || gene.parentB) && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Lineage</h4>
          <div className="flex items-center gap-4">
            {gene.parentA && (
              <div className="px-3 py-2 bg-white/5 rounded-lg">
                <span className="text-xs text-gray-500">Parent A</span>
                <p className="text-sm font-mono">#{gene.parentA}</p>
              </div>
            )}
            {gene.parentB && (
              <div className="px-3 py-2 bg-white/5 rounded-lg">
                <span className="text-xs text-gray-500">Parent B</span>
                <p className="text-sm font-mono">#{gene.parentB}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Traits */}
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-2">Traits</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {displayInfo.traits.map((trait, index) => (
            <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
              <span>{trait.icon}</span>
              <div>
                <p className="text-xs text-gray-500">{trait.name}</p>
                <p className="text-sm font-medium" style={{ color: trait.color }}>{trait.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Payload 标签页
 */
function PayloadTab({ payload }: { payload: UnifiedGene['payload'] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="Format" value={GeneFormat[payload.format]} />
        <InfoItem label="Encoding" value={payload.encoding} />
        <InfoItem label="MIME Type" value={payload.mimeType} />
        <InfoItem label="Content Hash" value={formatHash(payload.contentHash)} />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-2">Data Preview</h4>
        <pre className="bg-black/50 rounded-lg p-4 text-xs text-gray-400 overflow-auto max-h-64">
          {payload.data.slice(0, 2000)}
          {payload.data.length > 2000 && '\n\n... (truncated)'}
        </pre>
      </div>
    </div>
  );
}

/**
 * 元数据标签页
 */
function MetadataTab({ metadata }: { metadata?: Record<string, any> }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No metadata available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(metadata).map(([key, value]) => (
        <div key={key} className="border-b border-white/5 pb-4 last:border-0">
          <h4 className="text-sm font-medium text-gray-400 mb-1 capitalize">{key}</h4>
          <div className="bg-black/30 rounded-lg p-3">
            {typeof value === 'object' ? (
              <pre className="text-xs text-gray-400 overflow-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-gray-300">{String(value)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 原始数据标签页
 */
function RawDataTab({ gene }: { gene: UnifiedGene }) {
  return (
    <div>
      <pre className="bg-black/50 rounded-lg p-4 text-xs text-gray-400 overflow-auto max-h-96">
        {JSON.stringify(gene, null, 2)}
      </pre>
    </div>
  );
}

/**
 * 信息项组件
 */
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 bg-white/5 rounded-lg">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-300 truncate" title={value}>{value}</p>
    </div>
  );
}

// 格式化地址
function formatAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// 格式化哈希
function formatHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

export default GeneDetailView;
