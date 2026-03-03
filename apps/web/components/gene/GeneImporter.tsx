'use client';

import React, { useState, useCallback } from 'react';
import {
  importTool,
  autoImport,
  detectFormat,
  toDisplayInfo,
  GeneFormat,
  ImportSource,
  type ImportResult,
  type UnifiedGene,
} from '@/lib/gugs';

interface GeneImporterProps {
  onImport?: (result: ImportResult) => void;
  onImportMultiple?: (results: ImportResult[]) => void;
  allowBatch?: boolean;
  className?: string;
}

/**
 * 基因导入组件 - 支持从 EvoMap/ClawHub 导入基因
 */
export function GeneImporter({ 
  onImport, 
  onImportMultiple, 
  allowBatch = true,
  className = '' 
}: GeneImporterProps) {
  const [input, setInput] = useState('');
  const [source, setSource] = useState<ImportSource | 'auto'>('auto');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [detectedFormat, setDetectedFormat] = useState<GeneFormat | null>(null);

  // 检测输入格式
  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim()) {
      const format = detectFormat(value);
      setDetectedFormat(format);
    } else {
      setDetectedFormat(null);
    }
  };

  // 执行导入
  const handleImport = useCallback(async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const options = source !== 'auto' ? { source } : undefined;
      const result = await autoImport(input, options);
      
      setResults((prev) => [...prev, result]);
      onImport?.(result);
    } finally {
      setLoading(false);
    }
  }, [input, source, onImport]);

  // 批量导入
  const handleBatchImport = useCallback(async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      // 尝试将输入解析为数组
      let items: string[] = [];
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
          items = parsed.map(item => typeof item === 'string' ? item : JSON.stringify(item));
        } else {
          items = [input];
        }
      } catch {
        // 尝试按分隔符分割
        items = input.split(/\n---\n|\n###\n/).filter(s => s.trim());
        if (items.length === 0) {
          items = [input];
        }
      }

      const importResults = await Promise.all(
        items.map((item) => autoImport(item, source !== 'auto' ? { source } : undefined))
      );

      setResults((prev) => [...prev, ...importResults]);
      onImportMultiple?.(importResults);
    } finally {
      setLoading(false);
    }
  }, [input, source, onImportMultiple]);

  // 获取格式标签
  const getFormatLabel = (format: GeneFormat | null) => {
    switch (format) {
      case GeneFormat.GEP:
        return { label: 'GEP (EvoMap)', color: 'text-purple-400 bg-purple-500/20' };
      case GeneFormat.SkillMD:
        return { label: 'SkillMD (ClawHub)', color: 'text-blue-400 bg-blue-500/20' };
      case GeneFormat.Native:
        return { label: 'Native (GenLoop)', color: 'text-green-400 bg-green-500/20' };
      case GeneFormat.Custom:
        return { label: 'Custom', color: 'text-orange-400 bg-orange-500/20' };
      default:
        return { label: 'Unknown', color: 'text-gray-400 bg-gray-500/20' };
    }
  };

  const formatInfo = getFormatLabel(detectedFormat);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 输入区域 */}
      <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Import Gene</h3>
          
          {/* 格式检测指示器 */}
          {detectedFormat !== null && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${formatInfo.color}`}>
              Detected: {formatInfo.label}
            </span>
          )}
        </div>

        {/* 来源选择 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { value: 'auto', label: '🤖 Auto Detect' },
            { value: ImportSource.EvoMap, label: '🧬 EvoMap' },
            { value: ImportSource.ClawHub, label: '📝 ClawHub' },
            { value: ImportSource.Native, label: '🔵 Native' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSource(option.value as ImportSource | 'auto')}
              className={`px-3 py-1 text-xs rounded-lg border transition ${
                source === option.value
                  ? 'bg-primary-600 border-primary-500 text-white'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 文本输入 */}
        <textarea
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Paste your gene data here...&#10;&#10;Supports:&#10;- GEP (EvoMap) JSON format&#10;- SKILL.md (ClawHub) Markdown format&#10;- Native GenLoop format"
          className="w-full h-48 bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary-500/50 resize-none font-mono"
        />

        {/* 操作按钮 */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleImport}
            disabled={!input.trim() || loading}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg font-medium transition"
          >
            {loading ? 'Importing...' : 'Import'}
          </button>
          
          {allowBatch && (
            <button
              onClick={handleBatchImport}
              disabled={!input.trim() || loading}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg font-medium transition"
            >
              Batch Import
            </button>
          )}
        </div>
      </div>

      {/* 导入结果 */}
      {results.length > 0 && (
        <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Import Results</h3>
            <button
              onClick={() => setResults([])}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Clear
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-auto">
            {results.map((result, index) => (
              <ImportResultItem key={index} result={result} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 导入结果项组件
 */
function ImportResultItem({ result, index }: { result: ImportResult; index: number }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!result.success) {
    return (
      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div className="flex items-center gap-2 text-red-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Import #{index + 1} Failed</span>
        </div>
        <p className="text-xs text-red-400/80 mt-1 ml-6">{result.error}</p>
      </div>
    );
  }

  const gene = result.gene!;
  const displayInfo = toDisplayInfo(gene);

  return (
    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{gene.metadata?.name || `Gene ${gene.id}`}</span>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2 ml-6">
        <span className="text-xs text-gray-400">Format: {displayInfo.formatLabel}</span>
        <span className="text-gray-600">•</span>
        <span className="text-xs text-gray-400">Rarity: {displayInfo.rarityLabel}</span>
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <div className="mt-2 ml-6">
          {result.warnings.map((warning, i) => (
            <p key={i} className="text-xs text-yellow-500/80">⚠️ {warning}</p>
          ))}
        </div>
      )}

      {showDetails && (
        <div className="mt-3 ml-6">
          <pre className="bg-black/30 rounded-lg p-2 text-xs text-gray-400 overflow-auto max-h-40">
            {JSON.stringify(gene, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default GeneImporter;
