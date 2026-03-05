import { cn } from "../lib/utils";

/**
 * 加载状态组件
 * 用于 Suspense fallback 和异步加载状态
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-slate-600 border-t-blue-500",
          sizeClasses[size]
        )}
      />
      {text && (
        <span className="text-sm text-slate-400">{text}</span>
      )}
    </div>
  );
}

/**
 * 骨架屏组件
 * 用于内容加载时的占位
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        'bg-slate-700',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  );
}

/**
 * 页面加载占位符
 * 用于路由切换时的全屏加载状态
 */
export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-900">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  );
}

/**
 * 延迟加载包装器
 * 用于延迟显示加载状态，避免闪烁
 */
interface DelayedLoaderProps {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
}

export function DelayedLoader({ 
  children, 
  delay = 200,
  fallback 
}: DelayedLoaderProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) {
    return fallback || null;
  }

  return <>{children}</>;
}

// 导入 React
import { useState, useEffect } from 'react';
