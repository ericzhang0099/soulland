'use client';

import { useEffect, useRef, useCallback } from 'react';

// 虚拟列表Hook（优化版）
interface UseVirtualListOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
}

export function useVirtualList(options: UseVirtualListOptions) {
  const { itemCount, itemHeight, overscan = 5 } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  const calculateRange = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, clientHeight } = container;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      itemCount,
      Math.ceil((scrollTop + clientHeight) / itemHeight) + overscan
    );

    setVisibleRange({ start, end });
  }, [itemCount, itemHeight, overscan]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    calculateRange();
    container.addEventListener('scroll', calculateRange);
    return () => container.removeEventListener('scroll', calculateRange);
  }, [calculateRange]);

  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    containerRef,
    visibleRange,
    totalHeight,
    offsetY,
  };
}

// 无限滚动Hook（优化版）
interface UseInfiniteScrollOptions {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  threshold?: number;
}

export function useInfiniteScroll(options: UseInfiniteScrollOptions) {
  const { onLoadMore, hasMore, threshold = 100 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setIsLoading(true);
          await onLoadMore();
          setIsLoading(false);
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observerRef.current.observe(target);

    return () => observerRef.current?.disconnect();
  }, [onLoadMore, hasMore, threshold, isLoading]);

  return { targetRef, isLoading };
}

// 防抖Hook（优化版）
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// 节流Hook（优化版）
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const lastRun = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRun.current >= limit) {
        lastRun.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          callback(...args);
        }, limit - (now - lastRun.current));
      }
    },
    [callback, limit]
  ) as T;
}

// 记忆化计算Hook
export function useMemoized<T, D extends any[]>(
  factory: () => T,
  deps: D
): T {
  const ref = useRef<{ deps: D; value: T }>();

  if (!ref.current || !deps.every((dep, i) => dep === ref.current!.deps[i])) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}

// RAF节流Hook
export function useRafThrottle<T extends (...args: any[]) => any>(callback: T): T {
  const rafId = useRef<number>();
  const lastArgs = useRef<Parameters<T>>();

  return useCallback(
    (...args: Parameters<T>) => {
      lastArgs.current = args;

      if (rafId.current) return;

      rafId.current = requestAnimationFrame(() => {
        callback(...lastArgs.current!);
        rafId.current = undefined;
      });
    },
    [callback]
  ) as T;
}

// 批量更新Hook
export function useBatchedState<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);
  const pendingUpdates = useRef<Partial<T>[]>([]);
  const rafId = useRef<number>();

  const batchUpdate = useCallback((update: Partial<T>) => {
    pendingUpdates.current.push(update);

    if (rafId.current) return;

    rafId.current = requestAnimationFrame(() => {
      setState((prev) => {
        let newState = prev;
        pendingUpdates.current.forEach((update) => {
          newState = { ...newState, ...update };
        });
        pendingUpdates.current = [];
        return newState;
      });
      rafId.current = undefined;
    });
  }, []);

  return [state, batchUpdate] as const;
}

// 组件渲染计数器（开发调试用）
export function useRenderCount(componentName: string) {
  const count = useRef(0);

  useEffect(() => {
    count.current++;
    console.log(`${componentName} rendered ${count.current} times`);
  });

  return count.current;
}

// 昂贵的计算记忆化
export function useExpensiveMemo<T, D extends any[]>(
  factory: () => T,
  deps: D,
  maxAge: number = 5000
): T {
  const cache = useRef<{ value: T; timestamp: number; deps: D } | null>(null);

  const now = Date.now();
  const isStale = !cache.current ||
    now - cache.current.timestamp > maxAge ||
    !deps.every((dep, i) => dep === cache.current!.deps[i]);

  if (isStale) {
    cache.current = {
      value: factory(),
      timestamp: now,
      deps,
    };
  }

  return cache.current.value;
}

import { useState } from 'react';
