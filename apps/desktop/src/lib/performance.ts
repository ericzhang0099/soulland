/**
 * 性能优化工具函数
 */

/**
 * 分批处理大量数据
 * 避免阻塞主线程
 */
export function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => R,
  options: {
    batchSize?: number;
    delay?: number;
    onProgress?: (processed: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const { batchSize = 100, delay = 0, onProgress } = options;
  const results: R[] = [];

  return new Promise((resolve, reject) => {
    let index = 0;

    function processBatch() {
      const batch = items.slice(index, index + batchSize);

      try {
        for (const item of batch) {
          results.push(processor(item));
        }

        index += batch.length;
        onProgress?.(index, items.length);

        if (index < items.length) {
          if (delay > 0) {
            setTimeout(processBatch, delay);
          } else {
            // 使用 requestIdleCallback 或 setTimeout 让出主线程
            if (typeof requestIdleCallback !== 'undefined') {
              requestIdleCallback(processBatch);
            } else {
              setTimeout(processBatch, 0);
            }
          }
        } else {
          resolve(results);
        }
      } catch (error) {
        reject(error);
      }
    }

    processBatch();
  });
}

/**
 * 使用 Web Worker 处理耗时任务
 */
export function createWorkerTask<T, R>(
  workerScript: string
): (data: T) => Promise<R> {
  return (data: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerScript);

      worker.onmessage = (event) => {
        resolve(event.data);
        worker.terminate();
      };

      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };

      worker.postMessage(data);
    });
  };
}

/**
 * 内存使用监控
 */
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 长任务分割器
 * 将长任务分割成多个小任务
 */
export function scheduleTask(callback: () => void, priority: 'high' | 'low' = 'low'): void {
  if (priority === 'high') {
    // 高优先级：使用 MessageChannel 或 Promise
    if (typeof MessageChannel !== 'undefined') {
      const channel = new MessageChannel();
      channel.port1.onmessage = callback;
      channel.port2.postMessage(null);
    } else {
      Promise.resolve().then(callback);
    }
  } else {
    // 低优先级：使用 requestIdleCallback 或 setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(callback);
    } else {
      setTimeout(callback, 0);
    }
  }
}

/**
 * 资源预加载
 */
export const resourcePreloader = {
  /**
   * 预加载图片
   */
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  /**
   * 预加载脚本
   */
  preloadScript: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  /**
   * 预加载样式
   */
  preloadStyle: (href: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    });
  },

  /**
   * 使用 link rel="preload" 预加载关键资源
   */
  addPreloadLink: (href: string, as: 'script' | 'style' | 'image' | 'font' | 'fetch') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (as === 'font') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  },

  /**
   * 使用 link rel="prefetch" 预获取未来可能使用的资源
   */
  addPrefetchLink: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },
};

/**
 * 测量函数执行时间
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    const result = fn(...args);

    if (result instanceof Promise) {
      return result.finally(() => {
        console.log(`${name} took ${performance.now() - start}ms`);
      }) as ReturnType<T>;
    } else {
      console.log(`${name} took ${performance.now() - start}ms`);
      return result;
    }
  }) as T;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
