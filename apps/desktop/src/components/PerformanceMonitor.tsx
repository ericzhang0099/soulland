import { useState, useEffect } from 'react';
import { getMemoryUsage, formatBytes } from '../lib/performance';

/**
 * 性能监控面板
 * 用于开发和调试时监控应用性能
 */

interface PerformanceMetrics {
  fps: number;
  memory: {
    used: string;
    total: string;
    limit: string;
  } | null;
  loadTime: number;
  domNodes: number;
  listeners: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memory: null,
    loadTime: 0,
    domNodes: 0,
    listeners: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 只在开发环境显示
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // 计算加载时间
    const loadTime = performance.timing 
      ? performance.timing.loadEventEnd - performance.timing.navigationStart
      : 0;

    let frameCount = 0;
    let lastTime = performance.now();

    const updateMetrics = () => {
      const now = performance.now();
      frameCount++;

      if (now - lastTime >= 1000) {
        const memory = getMemoryUsage();

        setMetrics({
          fps: frameCount,
          memory: memory
            ? {
                used: formatBytes(memory.usedJSHeapSize),
                total: formatBytes(memory.totalJSHeapSize),
                limit: formatBytes(memory.jsHeapSizeLimit),
              }
            : null,
          loadTime,
          domNodes: document.getElementsByTagName('*').length,
          listeners: 0, // 获取监听器数量较复杂，暂设为0
        });

        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(updateMetrics);
    };

    const rafId = requestAnimationFrame(updateMetrics);

    return () => cancelAnimationFrame(rafId);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* 切换按钮 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-10 right-4 z-50 bg-slate-800 text-white px-3 py-1 rounded text-xs opacity-50 hover:opacity-100 transition-opacity"
      >
        {isVisible ? '隐藏' : '性能'}
      </button>

      {/* 性能面板 */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-slate-900 border border-slate-700 rounded-lg p-4 text-xs text-slate-300 shadow-lg min-w-[200px]">
          <h4 className="font-semibold mb-2 text-white">性能监控</h4>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={metrics.fps < 30 ? 'text-red-400' : 'text-green-400'}>
                {metrics.fps}
              </span>
            </div>

            {metrics.memory && (
              <>
                <div className="flex justify-between">
                  <span>内存使用:</span>
                  <span>{metrics.memory.used}</span>
                </div>
                <div className="flex justify-between">
                  <span>内存限制:</span>
                  <span>{metrics.memory.limit}</span>
                </div>
              </>
            )}

            <div className="flex justify-between">
              <span>加载时间:</span>
              <span>{metrics.loadTime}ms</span>
            </div>

            <div className="flex justify-between">
              <span>DOM 节点:</span>
              <span>{metrics.domNodes}</span>
            </div>
          </div>

          <button
            onClick={() => {
              // 手动触发垃圾回收（仅在部分浏览器支持）
              if ((window as any).gc) {
                (window as any).gc();
              }
            }}
            className="mt-3 w-full bg-slate-700 hover:bg-slate-600 text-white py-1 rounded transition-colors"
          >
            触发 GC
          </button>
        </div>
      )}
    </>
  );
}

export default PerformanceMonitor;
