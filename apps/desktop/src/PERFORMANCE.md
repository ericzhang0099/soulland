# GenLoop Desktop 性能优化指南

本文档描述了 GenLoop Desktop 应用的性能优化实现。

## 1. 路由级代码分割 (React.lazy + Suspense)

### 实现位置
- `src/lib/lazyLoad.tsx` - 懒加载工具函数
- `src/App.tsx` - 应用主组件

### 功能
- 使用 `React.lazy` 动态导入模式组件
- 使用 `Suspense` 提供加载状态
- 预加载策略：当用户使用一个模式时，预加载另一个模式

### 使用方式
```tsx
import { Suspense } from 'react';
import { AgentModeLazy, Web3ModeLazy } from './lib/lazyLoad';
import { PageLoader } from './components/LoadingSpinner';

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      {mode === 'agent' ? <AgentModeLazy /> : <Web3ModeLazy />}
    </Suspense>
  );
}
```

## 2. 组件懒加载

### 实现位置
- `src/lib/lazyLoad.tsx` - 懒加载配置
- `src/components/LoadingSpinner.tsx` - 加载状态组件

### 功能
- 支持按需加载大型组件（如 WalletBar）
- 提供多种加载状态组件（LoadingSpinner、Skeleton、PageLoader）
- 延迟加载器（DelayedLoader）避免闪烁

### 使用方式
```tsx
import { withLazyLoad } from './lib/lazyLoad';
import { LoadingSpinner } from './components/LoadingSpinner';

const LazyWalletBar = withLazyLoad(WalletBar, <LoadingSpinner />);
```

## 3. 图片/资源优化

### 实现位置
- `src/lib/imageOptimizer.tsx` - 图片优化组件

### 功能
- **OptimizedImage**: 支持懒加载、模糊占位符、错误处理
- **ResponsiveImage**: 响应式图片，根据屏幕尺寸加载不同分辨率
- **imagePreloader**: 图片预加载工具

### 使用方式
```tsx
import { OptimizedImage, imagePreloader } from './lib/imageOptimizer';

// 使用优化图片组件
<OptimizedImage
  src="/path/to/image.jpg"
  alt="描述"
  placeholder="/path/to/placeholder.jpg"
  aspectRatio="16/9"
/>

// 预加载关键图片
imagePreloader.preloadCritical(['/hero.jpg', '/logo.png']);
```

## 4. 缓存策略 (localStorage)

### 实现位置
- `src/lib/cache.ts` - 缓存管理器

### 功能
- **CacheManager**: 通用缓存管理类
- **configCache**: 应用配置缓存（7天过期）
- **userCache**: 用户数据缓存（1小时过期）
- **apiCache**: API 响应缓存（5分钟过期）
- **useCachedValue**: React Hook 用于缓存数据获取

### 使用方式
```tsx
import { cache, configCache, useCachedValue } from './lib/cache';

// 基础缓存操作
cache.set('key', value, 60000); // 缓存1分钟
const value = cache.get('key');

// 配置缓存
configCache.set('theme', 'dark', null); // 永不过期

// React Hook
const { data, loading, error, refresh } = useCachedValue(
  'userData',
  fetchUserData,
  [userId],
  60000
);
```

## 5. 性能优化 Hooks

### 实现位置
- `src/hooks/usePerformance.ts`

### 功能
- **useDebounce**: 防抖
- **useThrottle**: 节流
- **useVirtualList**: 虚拟列表
- **useIntersectionObserver**: 交叉观察器
- **useLazyData**: 懒加载数据

### 使用方式
```tsx
import { useDebounce, useVirtualList } from './hooks/usePerformance';

// 防抖
const debouncedSearch = useDebounce(searchTerm, 300);

// 虚拟列表
const { virtualItems, totalHeight } = useVirtualList(
  items,
  containerRef,
  { itemHeight: 50, overscan: 5 }
);
```

## 6. 性能工具函数

### 实现位置
- `src/lib/performance.ts`

### 功能
- **batchProcess**: 分批处理大量数据
- **createWorkerTask**: Web Worker 任务
- **resourcePreloader**: 资源预加载
- **debounce/throttle**: 防抖节流函数
- **measurePerformance**: 性能测量

## 7. 性能监控

### 实现位置
- `src/components/PerformanceMonitor.tsx`

### 功能
- 实时监控 FPS
- 内存使用监控
- 页面加载时间
- DOM 节点数量

### 使用方式
```tsx
import { PerformanceMonitor } from './components/PerformanceMonitor';

function App() {
  return (
    <>
      <YourApp />
      <PerformanceMonitor /> {/* 仅在开发环境显示 */}
    </>
  );
}
```

## 8. 应用状态缓存

### 实现位置
- `src/stores/appStore.ts`

### 功能
- 自动缓存用户偏好（模式选择、侧边栏状态）
- 应用启动时从缓存恢复状态

## 最佳实践

1. **代码分割**: 将大型组件和路由拆分为独立的 chunk
2. **懒加载图片**: 使用 OptimizedImage 组件替代原生 img
3. **缓存数据**: 合理使用缓存避免重复请求
4. **防抖节流**: 处理高频事件（搜索、滚动、调整大小）
5. **虚拟列表**: 渲染大量数据时使用虚拟列表
6. **预加载**: 预加载用户可能访问的资源
7. **监控性能**: 使用 PerformanceMonitor 监控应用性能

## 构建优化

确保 Vite 配置启用代码分割：

```ts
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
}
```
