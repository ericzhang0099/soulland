// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 测量函数执行时间
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    this.record(name, end - start);
    return result;
  }

  // 异步测量
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    this.record(name, end - start);
    return result;
  }

  // 记录指标
  private record(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  // 获取统计
  getStats(name: string) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  // 获取所有指标
  getAllStats() {
    const stats: Record<string, any> = {};
    this.metrics.forEach((_, name) => {
      stats[name] = this.getStats(name);
    });
    return stats;
  }

  // 清除指标
  clear(name?: string) {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

// Web Vitals 监控
export function monitorWebVitals() {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;
    console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const delay = (entry as any).processingStart - entry.startTime;
      console.log('FID:', delay);
    }
  }).observe({ entryTypes: ['first-input'] });

  // Cumulative Layout Shift
  let clsValue = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
    console.log('CLS:', clsValue);
  }).observe({ entryTypes: ['layout-shift'] });
}

// 内存监控
export function monitorMemory() {
  if (typeof window === 'undefined' || !(performance as any).memory) return;

  setInterval(() => {
    const memory = (performance as any).memory;
    console.log('Memory:', {
      used: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      total: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      limit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
    });
  }, 30000);
}

// 长任务监控
export function monitorLongTasks() {
  if (typeof window === 'undefined') return;

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.warn('Long Task detected:', entry.duration + 'ms');
    }
  }).observe({ entryTypes: ['longtask'] });
}

// 资源加载监控
export function monitorResources() {
  if (typeof window === 'undefined') return;

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const resource = entry as PerformanceResourceTiming;
      if (resource.duration > 1000) {
        console.warn('Slow resource:', resource.name, resource.duration + 'ms');
      }
    }
  }).observe({ entryTypes: ['resource'] });
}

// 代码分割加载器
export function lazyLoadComponent(importFn: () => Promise<any>) {
  return React.lazy(async () => {
    const start = performance.now();
    const module = await importFn();
    const end = performance.now();
    console.log(`Component loaded in ${(end - start).toFixed(2)}ms`);
    return module;
  });
}

// 预加载资源
export function preloadResource(href: string, as: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

// 预连接域名
export function preconnectDomain(href: string) {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = href;
  document.head.appendChild(link);
}

// DNS预解析
export function dnsPrefetch(href: string) {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = href;
  document.head.appendChild(link);
}

import React from 'react';
