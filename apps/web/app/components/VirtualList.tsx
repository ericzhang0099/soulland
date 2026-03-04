'use client';

import { useRef } from 'react';
import { useInView } from '../hooks/useUtils';

interface InfiniteLoaderProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  children: React.ReactNode;
}

export function InfiniteLoader({
  onLoadMore,
  hasMore,
  isLoading,
  children,
}: InfiniteLoaderProps) {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  if (isInView && hasMore && !isLoading) {
    onLoadMore();
  }

  return (
    <>
      {children}
      <div ref={ref} className="py-4">
        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        {!hasMore && !isLoading && (
          <p className="text-center text-gray-400">没有更多数据了</p>
        )}
      </div>
    </>
  );
}

// 虚拟列表组件
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 简化的虚拟列表实现
  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: '100%' }}
    >
      <div style={{ height: items.length * itemHeight }}>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              height: itemHeight,
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// 懒加载图片组件
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export function LazyImage({
  src,
  alt,
  className,
  placeholder,
}: LazyImageProps) {
  const { ref, isInView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div ref={ref} className={className}>
      {isInView ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-700 animate-pulse">
          {placeholder && (
            <img
              src={placeholder}
              alt={alt}
              className="w-full h-full object-cover blur-sm"
            />
          )}
        </div>
      )}
    </div>
  );
}
