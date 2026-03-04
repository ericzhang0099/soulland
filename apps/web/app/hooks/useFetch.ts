'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseFetchOptions<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  immediate?: boolean;
}

interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (updater: (prev: T | null) => T) => void;
}

export function useFetch<T>(options: UseFetchOptions<T>): UseFetchResult<T> {
  const { url, method = 'GET', body, headers = {}, immediate = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [url, method, body, headers]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  const mutate = useCallback((updater: (prev: T | null) => T) => {
    setData((prev) => updater(prev));
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    mutate,
  };
}

// 乐观更新Hook
interface UseOptimisticOptions<T> {
  initialData: T;
  updateFn: (data: T) => Promise<T>;
}

export function useOptimistic<T>(options: UseOptimisticOptions<T>) {
  const { initialData, updateFn } = options;

  const [data, setData] = useState<T>(initialData);
  const [isPending, setIsPending] = useState(false);

  const update = useCallback(
    async (optimisticData: T) => {
      const previousData = data;
      
      // 乐观更新
      setData(optimisticData);
      setIsPending(true);

      try {
        const result = await updateFn(optimisticData);
        setData(result);
      } catch (error) {
        // 回滚
        setData(previousData);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [data, updateFn]
  );

  return { data, isPending, update };
}

// 轮询Hook
interface UsePollingOptions {
  interval?: number;
  enabled?: boolean;
}

export function usePolling(
  callback: () => Promise<void>,
  options: UsePollingOptions = {}
) {
  const { interval = 5000, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(callback, interval);
    return () => clearInterval(timer);
  }, [callback, interval, enabled]);
}

// 缓存Hook
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheItem<any>>();

export function useCache<T>(key: string, ttl: number = 5 * 60 * 1000) {
  const get = useCallback((): T | null => {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > ttl) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  }, [key, ttl]);

  const set = useCallback(
    (data: T) => {
      cache.set(key, { data, timestamp: Date.now() });
    },
    [key]
  );

  const remove = useCallback(() => {
    cache.delete(key);
  }, [key]);

  return { get, set, remove };
}
