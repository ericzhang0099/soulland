'use client';

import { Suspense, lazy } from 'react';
import { Skeleton } from './Skeleton';

// 懒加载页面组件
export const LazyMarketPage = lazy(() => import('./market/MarketContent'));
export const LazyGeneDetailPage = lazy(() => import('./genes/GeneDetailContent'));
export const LazyTrainingPage = lazy(() => import('./training/TrainingContent'));
export const LazyLeaderboardPage = lazy(() => import('./leaderboard/LeaderboardContent'));
export const LazyProfilePage = lazy(() => import('./profile/ProfileContent'));

// 懒加载组件
export const LazyPriceChart = lazy(() => import('./PriceChart'));
export const LazyGeneCard = lazy(() => import('./GeneCard'));
export const LazyModal = lazy(() => import('./Modal'));

// 加载占位组件
export function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">加载中...</p>
      </div>
    </div>
  );
}

export function ComponentLoader() {
  return <Skeleton className="h-32" />;
}

// 带Suspense的懒加载包装器
export function withLazyLoading(
  Component: React.ComponentType,
  fallback?: React.ReactNode
) {
  return function LazyComponent(props: any) {
    return (
      <Suspense fallback={fallback || <ComponentLoader />}>
        <Component {...props} />
      </Suspense>
    );
  };
}
