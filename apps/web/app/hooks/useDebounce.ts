'use client';

import { useState, useEffect, useCallback } from 'react';

// 防抖值Hook
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 节流值Hook
export function useThrottledValue<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [lastExecuted, setLastExecuted] = useState(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeElapsed = now - lastExecuted;

    if (timeElapsed >= limit) {
      setThrottledValue(value);
      setLastExecuted(now);
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        setLastExecuted(Date.now());
      }, limit - timeElapsed);

      return () => clearTimeout(timer);
    }
  }, [value, limit, lastExecuted]);

  return throttledValue;
}

// 防抖回调Hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const id = setTimeout(() => {
        callback(...args);
      }, delay);

      setTimeoutId(id);
    },
    [callback, delay, timeoutId]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}

// 节流回调Hook
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const [lastExecuted, setLastExecuted] = useState(0);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeElapsed = now - lastExecuted;

      if (timeElapsed >= limit) {
        callback(...args);
        setLastExecuted(now);
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const id = setTimeout(() => {
          callback(...args);
          setLastExecuted(Date.now());
        }, limit - timeElapsed);

        setTimeoutId(id);
      }
    },
    [callback, limit, lastExecuted, timeoutId]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return throttledCallback;
}

// 防抖状态Hook
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebouncedValue(value, delay);

  return [value, debouncedValue, setValue];
}

// 防抖效果Hook
export function useDebouncedEffect(
  effect: () => void,
  deps: any[],
  delay: number
) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const id = setTimeout(effect, delay);
    setTimeoutId(id);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
