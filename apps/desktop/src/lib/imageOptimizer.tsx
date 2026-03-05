import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from './utils';

/**
 * 图片优化组件
 * 支持懒加载、模糊占位符、错误处理
 */

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  placeholder?: string;
  blurHash?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  placeholder,
  blurHash,
  aspectRatio = '16/9',
  objectFit = 'cover',
  className,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // 使用 Intersection Observer 实现懒加载
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            imgRef.current.src = src;
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // 提前 50px 开始加载
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // 生成模糊占位符背景
  const placeholderStyle = blurHash
    ? { backgroundImage: `url(${blurHash})`, backgroundSize: 'cover' }
    : placeholder
    ? { backgroundImage: `url(${placeholder})`, backgroundSize: 'cover' }
    : { backgroundColor: '#1e293b' };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{ aspectRatio }}
    >
      {/* 占位符/加载状态 */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 animate-pulse bg-slate-800"
          style={placeholderStyle}
        />
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500">
          <span className="text-sm">加载失败</span>
        </div>
      )}

      {/* 实际图片 */}
      <img
        ref={imgRef}
        alt={alt}
        className={cn(
          'w-full h-full transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down'
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </div>
  );
}

/**
 * 响应式图片组件
 * 根据屏幕尺寸加载不同分辨率的图片
 */
interface ResponsiveImageProps extends OptimizedImageProps {
  srcSet?: { url: string; width: number }[];
  sizes?: string;
}

export function ResponsiveImage({
  srcSet,
  sizes = '100vw',
  src,
  ...props
}: ResponsiveImageProps) {
  const generateSrcSet = () => {
    if (!srcSet || srcSet.length === 0) return undefined;
    return srcSet.map((item) => `${item.url} ${item.width}w`).join(', ');
  };

  return (
    <OptimizedImage
      src={src}
      srcSet={generateSrcSet()}
      sizes={sizes}
      {...props}
    />
  );
}

/**
 * 图片预加载工具
 */
export const imagePreloader = {
  /**
   * 预加载单张图片
   */
  preload: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  /**
   * 预加载多张图片
   */
  preloadMultiple: (srcs: string[]): Promise<void[]> => {
    return Promise.all(srcs.map((src) => imagePreloader.preload(src)));
  },

  /**
   * 优先级预加载（用于首屏关键图片）
   */
  preloadCritical: (srcs: string[]) => {
    srcs.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  },
};
