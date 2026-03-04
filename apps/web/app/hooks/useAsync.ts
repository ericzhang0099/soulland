'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate = false
): UseAsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);
        setData(result);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, isLoading, error, execute, reset };
}

// 重试Hook
interface UseRetryOptions {
  maxRetries?: number;
  delay?: number;
  onError?: (error: Error, retryCount: number) => void;
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const { maxRetries = 3, delay = 1000, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await fn();
        setData(result);
        setIsLoading(false);
        return;
      } catch (err: any) {
        setRetryCount(i + 1);
        onError?.(err, i + 1);

        if (i === maxRetries) {
          setError(err);
          setIsLoading(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }, [fn, maxRetries, delay, onError]);

  return { data, isLoading, error, retryCount, execute };
}

// 并行请求Hook
export function useParallel<T extends Record<string, Promise<any>>(
  promises: T
) {
  const [results, setResults] = useState<Partial<{ [K in keyof T]: any }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<{ [K in keyof T]: Error }>>({});

  useEffect(() => {
    const execute = async () => {
      setIsLoading(true);
      
      const entries = Object.entries(promises);
      const settled = await Promise.allSettled(
        entries.map(([, promise]) => promise)
      );

      const newResults: any = {};
      const newErrors: any = {};

      settled.forEach((result, index) => {
        const key = entries[index][0];
        if (result.status === 'fulfilled') {
          newResults[key] = result.value;
        } else {
          newErrors[key] = result.reason;
        }
      });

      setResults(newResults);
      setErrors(newErrors);
      setIsLoading(false);
    };

    execute();
  }, [promises]);

  return { results, isLoading, errors };
}

// 顺序请求Hook
export function useSequence<T>(
  fns: Array<() => Promise<T>>
) {
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setCurrentIndex(0);

    const newResults: T[] = [];

    for (let i = 0; i < fns.length; i++) {
      try {
        const result = await fns[i]();
        newResults.push(result);
        setResults([...newResults]);
        setCurrentIndex(i + 1);
      } catch (err: any) {
        setError(err);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
  }, [fns]);

  return { results, isLoading, currentIndex, error, execute };
}

// 取消请求Hook
export function useCancelable<T>() {
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const execute = useCallback(
    async (fn: (signal: AbortSignal) => Promise<T>) => {
      // 取消之前的请求
      abortController?.abort();

      const newController = new AbortController();
      setAbortController(newController);

      try {
        const result = await fn(newController.signal);
        return result;
      } finally {
        setAbortController(null);
      }
    },
    [abortController]
  );

  const cancel = useCallback(() => {
    abortController?.abort();
  }, [abortController]);

  return { execute, cancel };
}
