/**
 * 缓存策略工具
 * 提供 localStorage 和内存缓存的封装
 */

// 缓存项类型
interface CacheItem<T> {
  value: T;
  expiry: number | null; // 过期时间戳，null 表示永不过期
  version: string;
}

// 缓存配置
interface CacheConfig {
  prefix: string;
  version: string;
  defaultTTL: number; // 默认过期时间（毫秒）
}

// 默认配置
const DEFAULT_CONFIG: CacheConfig = {
  prefix: 'genloop:',
  version: '1.0.0',
  defaultTTL: 24 * 60 * 60 * 1000, // 24小时
};

// 内存缓存存储
const memoryCache = new Map<string, CacheItem<any>>();

/**
 * 缓存管理器类
 */
export class CacheManager {
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 生成完整的缓存键
   */
  private getKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(item: CacheItem<any>): boolean {
    if (item.expiry === null) return false;
    return Date.now() > item.expiry;
  }

  /**
   * 检查版本是否匹配
   */
  private isVersionMatch(item: CacheItem<any>): boolean {
    return item.version === this.config.version;
  }

  /**
   * 设置缓存项
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（毫秒），null 表示永不过期
   * @param useMemory 是否同时使用内存缓存
   */
  set<T>(key: string, value: T, ttl: number | null = this.config.defaultTTL, useMemory = false): void {
    const item: CacheItem<T> = {
      value,
      expiry: ttl !== null ? Date.now() + ttl : null,
      version: this.config.version,
    };

    const fullKey = this.getKey(key);

    // 存储到 localStorage
    try {
      localStorage.setItem(fullKey, JSON.stringify(item));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
      // 如果 localStorage 满了，清理过期项后重试
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.cleanup();
        try {
          localStorage.setItem(fullKey, JSON.stringify(item));
        } catch (e2) {
          console.error('Still failed to save after cleanup:', e2);
        }
      }
    }

    // 同时存储到内存缓存
    if (useMemory) {
      memoryCache.set(fullKey, item);
    }
  }

  /**
   * 获取缓存项
   * @param key 缓存键
   * @param useMemory 是否优先从内存缓存读取
   */
  get<T>(key: string, useMemory = false): T | null {
    const fullKey = this.getKey(key);

    // 优先从内存缓存读取
    if (useMemory) {
      const memoryItem = memoryCache.get(fullKey);
      if (memoryItem && !this.isExpired(memoryItem) && this.isVersionMatch(memoryItem)) {
        return memoryItem.value as T;
      }
    }

    // 从 localStorage 读取
    try {
      const data = localStorage.getItem(fullKey);
      if (!data) return null;

      const item: CacheItem<T> = JSON.parse(data);

      // 检查版本和过期时间
      if (!this.isVersionMatch(item)) {
        this.remove(key);
        return null;
      }

      if (this.isExpired(item)) {
        this.remove(key);
        return null;
      }

      // 同步到内存缓存
      if (useMemory) {
        memoryCache.set(fullKey, item);
      }

      return item.value;
    } catch (e) {
      console.error('Failed to read from cache:', e);
      return null;
    }
  }

  /**
   * 删除缓存项
   */
  remove(key: string): void {
    const fullKey = this.getKey(key);
    localStorage.removeItem(fullKey);
    memoryCache.delete(fullKey);
  }

  /**
   * 检查缓存项是否存在且有效
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 清理过期缓存项
   */
  cleanup(): void {
    const prefix = this.config.prefix;

    // 清理 localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const item: CacheItem<any> = JSON.parse(data);
            if (this.isExpired(item) || !this.isVersionMatch(item)) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // 解析失败，删除该项
          localStorage.removeItem(key);
        }
      }
    }

    // 清理内存缓存
    for (const [key, item] of memoryCache.entries()) {
      if (this.isExpired(item) || !this.isVersionMatch(item)) {
        memoryCache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    const prefix = this.config.prefix;

    // 清空 localStorage 中的相关项
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    }

    // 清空内存缓存
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { localStorage: number; memory: number } {
    const prefix = this.config.prefix;
    let localStorageCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        localStorageCount++;
      }
    }

    let memoryCount = 0;
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCount++;
      }
    }

    return {
      localStorage: localStorageCount,
      memory: memoryCount,
    };
  }
}

// 默认缓存实例
export const cache = new CacheManager();

/**
 * 应用配置缓存
 * 专门用于存储应用配置
 */
export const configCache = new CacheManager({
  prefix: 'genloop:config:',
  version: '1.0.0',
  defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7天
});

/**
 * 用户数据缓存
 * 专门用于存储用户相关数据
 */
export const userCache = new CacheManager({
  prefix: 'genloop:user:',
  version: '1.0.0',
  defaultTTL: 60 * 60 * 1000, // 1小时
});

/**
 * API 响应缓存
 * 专门用于缓存 API 响应
 */
export const apiCache = new CacheManager({
  prefix: 'genloop:api:',
  version: '1.0.0',
  defaultTTL: 5 * 60 * 1000, // 5分钟
});

/**
 * 缓存装饰器 - 用于函数结果缓存
 */
export function withCache<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const cacheKey = keyGenerator(...args);
    const cached = cache.get<ReturnType<T>>(cacheKey);

    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(cacheKey, result, ttl);
    return result;
  }) as T;
}

/**
 * React Hook: 使用缓存
 */
export function useCachedValue<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
  ttl?: number
): { data: T | null; loading: boolean; error: Error | null; refresh: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 先尝试从缓存读取
      const cached = cache.get<T>(key);
      if (cached !== null) {
        setData(cached);
        setLoading(false);
        return;
      }

      // 缓存未命中，调用 fetcher
      const result = await fetcher();
      cache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, deps);

  const refresh = async () => {
    cache.remove(key);
    await fetchData();
  };

  return { data, loading, error, refresh };
}

// 导入 React
import { useState, useEffect } from 'react';
