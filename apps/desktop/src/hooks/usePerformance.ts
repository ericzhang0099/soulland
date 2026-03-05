/**
 * 性能优化 Hooks
 * 提供防抖、节流、虚拟列表等性能优化功能
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * 防抖 Hook
 * 延迟执行函数，直到停止输入一段时间后才执行
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 节流 Hook
 * 限制函数执行频率
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const lastRun = useRef(Date.now());
  const timeout = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRun.current >= limit) {
        lastRun.current = now;
        callback(...args);
      } else {
        if (timeout.current) {
          clearTimeout(timeout.current);
        }
        timeout.current = setTimeout(() => {
          lastRun.current = Date.now();
          callback(...args);
        }, limit - (now - lastRun.current));
      }
    },
    [callback, limit]
  ) as T;
}

/**
 * 虚拟列表 Hook
 * 用于渲染大量数据时的性能优化
 */
interface UseVirtualListOptions {
  itemHeight: number;
  overscan?: number;
}

export function useVirtualList<T>(
  items: T[],
  containerRef: React.RefObject<HTMLElement>,
  options: UseVirtualListOptions
) {
  const { itemHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };

    // 初始化高度
    handleResize();

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [containerRef]);

  const virtualItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        left: 0,
        right: 0,
      },
    }));
  }, [items, scrollTop, containerHeight, itemHeight, overscan]);

  const totalHeight = items.length * itemHeight;

  return {
    virtualItems,
    totalHeight,
    startIndex: Math.max(0, Math.floor(scrollTop / itemHeight) - overscan),
  };
}

/**
 * Intersection Observer Hook
 * 用于实现无限滚动或懒加载
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
}

/**
 * 请求动画帧 Hook
 * 用于平滑动画
 */
export function useRequestAnimationFrame(callback: (time: number) => void) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback]);
}

/**
 * 内存优化 Hook
 * 用于清理不再使用的引用
 */
export function useMemoryCleanup(cleanupFn: () => void, deps: React.DependencyList = []) {
  useEffect(() => {
    return () => {
      cleanupFn();
    };
  }, deps);
}

/**
 * 测量性能 Hook
 * 用于测量组件渲染时间
 */
export function usePerformanceMeasure(componentName: string) {
  const startTime = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    console.log(`${componentName} rendered in ${endTime - startTime.current}ms`);
    startTime.current = endTime;
  });
}

/**
 * 懒加载数据 Hook
 * 用于分页加载大量数据
 */
export function useLazyData<T>(
  fetcher: (page: number) => Promise<T[]>,
  options: {
    pageSize?: number;
    threshold?: number;
  } = {}
) {
  const { pageSize = 20, threshold = 100 } = options;
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newData = await fetcher(page);
      if (newData.length < pageSize) {
        setHasMore(false);
      }
      setData((prev) => [...prev, ...newData]);
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, loading, hasMore, pageSize]);

  const isLoaderVisible = useIntersectionObserver(loaderRef, {
    rootMargin: `${threshold}px`,
  });

  useEffect(() => {
    if (isLoaderVisible) {
      loadMore();
    }
  }, [isLoaderVisible, loadMore]);

  return {
    data,
    loading,
    hasMore,
    loaderRef,
    loadMore,
    reset: () => {
      setData([]);
      setPage(1);
      setHasMore(true);
    },
  };
}
