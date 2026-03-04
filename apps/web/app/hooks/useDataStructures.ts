'use client';

import { useState, useEffect, useCallback } from 'react';

// 历史记录Hook
interface UseHistoryOptions<T> {
  maxSize?: number;
}

export function useHistory<T>(initialState: T, options: UseHistoryOptions<T> = {}) {
  const { maxSize = 50 } = options;
  
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const push = useCallback(
    (newState: T) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(newState);
        
        if (newHistory.length > maxSize) {
          newHistory.shift();
        }
        
        return newHistory;
      });
      setCurrentIndex((prev) => Math.min(prev + 1, maxSize - 1));
    },
    [currentIndex, maxSize]
  );

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [canRedo]);

  const reset = useCallback(() => {
    setHistory([initialState]);
    setCurrentIndex(0);
  }, [initialState]);

  return {
    state: history[currentIndex],
    push,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    history,
    currentIndex,
  };
}

// 队列Hook
export function useQueue<T>(initialItems: T[] = []) {
  const [queue, setQueue] = useState<T[]>(initialItems);

  const enqueue = useCallback((item: T) => {
    setQueue((prev) => [...prev, item]);
  }, []);

  const dequeue = useCallback(() => {
    const item = queue[0];
    setQueue((prev) => prev.slice(1));
    return item;
  }, [queue]);

  const peek = useCallback(() => queue[0], [queue]);

  const clear = useCallback(() => setQueue([]), []);

  const isEmpty = queue.length === 0;
  const size = queue.length;

  return { queue, enqueue, dequeue, peek, clear, isEmpty, size };
}

// 栈Hook
export function useStack<T>(initialItems: T[] = []) {
  const [stack, setStack] = useState<T[]>(initialItems);

  const push = useCallback((item: T) => {
    setStack((prev) => [...prev, item]);
  }, []);

  const pop = useCallback(() => {
    const item = stack[stack.length - 1];
    setStack((prev) => prev.slice(0, -1));
    return item;
  }, [stack]);

  const peek = useCallback(() => stack[stack.length - 1], [stack]);

  const clear = useCallback(() => setStack([]), []);

  const isEmpty = stack.length === 0;
  const size = stack.length;

  return { stack, push, pop, peek, clear, isEmpty, size };
}

// 集合Hook
export function useSet<T>(initialValues: T[] = []) {
  const [set, setSet] = useState<Set<T>>(new Set(initialValues));

  const add = useCallback((value: T) => {
    setSet((prev) => new Set([...prev, value]));
  }, []);

  const remove = useCallback((value: T) => {
    setSet((prev) => {
      const newSet = new Set(prev);
      newSet.delete(value);
      return newSet;
    });
  }, []);

  const toggle = useCallback((value: T) => {
    setSet((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  }, []);

  const has = useCallback((value: T) => set.has(value), [set]);

  const clear = useCallback(() => setSet(new Set()), []);

  const toArray = useCallback(() => Array.from(set), [set]);

  return { set, add, remove, toggle, has, clear, toArray, size: set.size };
}

// 映射Hook
export function useMap<K, V>(initialEntries?: [K, V][]) {
  const [map, setMap] = useState<Map<K, V>>(
    () => new Map(initialEntries)
  );

  const set = useCallback((key: K, value: V) => {
    setMap((prev) => new Map([...prev, [key, value]]));
  }, []);

  const get = useCallback((key: K) => map.get(key), [map]);

  const remove = useCallback((key: K) => {
    setMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const has = useCallback((key: K) => map.has(key), [map]);

  const clear = useCallback(() => setMap(new Map()), []);

  const toArray = useCallback(() => Array.from(map.entries()), [map]);

  return { map, set, get, remove, has, clear, toArray, size: map.size };
}
