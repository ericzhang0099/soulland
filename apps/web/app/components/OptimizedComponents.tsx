'use client';

import { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

// 优化的基因卡片（使用memo避免不必要的重渲染）
interface OptimizedGeneCardProps {
  gene: {
    id: string;
    name: string;
    description: string;
    price: string;
    owner: string;
    attributes: Record<string, number>;
  };
  onPurchase: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const OptimizedGeneCard = memo(function OptimizedGeneCard({
  gene,
  onPurchase,
  onViewDetails,
}: OptimizedGeneCardProps) {
  // 使用useMemo缓存计算结果
  const formattedPrice = useMemo(() => {
    return `${parseFloat(gene.price).toFixed(4)} AGC`;
  }, [gene.price]);

  const truncatedAddress = useMemo(() => {
    return `${gene.owner.slice(0, 6)}...${gene.owner.slice(-4)}`;
  }, [gene.owner]);

  // 使用useCallback缓存回调函数
  const handlePurchase = useCallback(() => {
    onPurchase(gene.id);
  }, [gene.id, onPurchase]);

  const handleViewDetails = useCallback(() => {
    onViewDetails(gene.id);
  }, [gene.id, onViewDetails]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors"
    >
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{gene.name}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{gene.description}</p>

        <div className="flex items-center justify-between mb-4">
          <span className="text-blue-400 font-bold">{formattedPrice}</span>
          <span className="text-xs text-gray-500">{truncatedAddress}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 py-2 px-4 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-colors"
          >
            详情
          </button>
          <button
            onClick={handlePurchase}
            className="flex-1 py-2 px-4 bg-blue-600 rounded-lg text-sm hover:bg-blue-500 transition-colors"
          >
            购买
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// 虚拟列表组件
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
}

export function OptimizedVirtualList<T>({
  items,
  itemHeight,
  renderItem,
  keyExtractor,
}: VirtualListProps<T>) {
  const { containerRef, visibleRange, totalHeight, offsetY } = useVirtualList({
    itemCount: items.length,
    itemHeight,
    overscan: 5,
  });

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={keyExtractor(item, visibleRange.start + index)} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 优化的图片组件
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className,
  placeholder = '/placeholder.png',
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-700 animate-pulse" />
      )}
      <img
        src={error ? placeholder : src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
});

import { useState } from 'react';
import { useVirtualList } from '../hooks/useOptimized';
