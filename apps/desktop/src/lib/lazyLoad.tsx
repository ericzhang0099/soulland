import { lazy, Suspense, ComponentType } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';

/**
 * 路由级代码分割 - 懒加载包装器
 * 使用 React.lazy 实现动态导入
 */

// 懒加载模式组件
export const AgentModeLazy = lazy(() => import('../modes/agent/AgentMode'));
export const Web3ModeLazy = lazy(() => import('../modes/web3/Web3Mode'));

// 懒加载面板组件
export const ChatPanelLazy = lazy(() => import('../modes/agent/ChatPanel'));
export const ToolsPanelLazy = lazy(() => import('../modes/agent/ToolsPanel'));

// 懒加载 UI 组件
export const WalletBarLazy = lazy(() => import('../components/WalletBar'));

/**
 * 带 Suspense 的懒加载组件包装器
 * @param Component 要懒加载的组件
 * @param fallback 自定义加载状态
 */
export function withLazyLoad<T extends object>(
  Component: ComponentType<T>,
  fallback?: React.ReactNode
) {
  return function LazyLoadedComponent(props: T) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * 预加载组件
 * 可以在用户即将访问某个路由时提前加载
 */
export const componentPreloader = {
  // 预加载 Agent 模式
  preloadAgentMode: () => {
    const AgentMode = import('../modes/agent/AgentMode');
    return AgentMode;
  },

  // 预加载 Web3 模式
  preloadWeb3Mode: () => {
    const Web3Mode = import('../modes/web3/Web3Mode');
    return Web3Mode;
  },

  // 预加载钱包组件
  preloadWalletBar: () => {
    const WalletBar = import('../components/WalletBar');
    return WalletBar;
  },

  // 预加载聊天面板
  preloadChatPanel: () => {
    const ChatPanel = import('../modes/agent/ChatPanel');
    return ChatPanel;
  },
};

/**
 * 路由预加载策略
 * 根据当前模式预加载另一个模式
 */
export function useRoutePreloader(currentMode: 'agent' | 'web3') {
  // 当用户在 Agent 模式时，预加载 Web3 模式
  // 当用户在 Web3 模式时，预加载 Agent 模式
  if (currentMode === 'agent') {
    // 延迟预加载，避免影响当前页面性能
    setTimeout(() => {
      componentPreloader.preloadWeb3Mode();
    }, 2000);
  } else {
    setTimeout(() => {
      componentPreloader.preloadAgentMode();
    }, 2000);
  }
}
