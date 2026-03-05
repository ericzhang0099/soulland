import { Suspense, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { useAppStore } from './stores/appStore';
import { AgentModeLazy, Web3ModeLazy, useRoutePreloader } from './lib/lazyLoad';
import { PageLoader } from './components/LoadingSpinner';

function App() {
  const { mode } = useAppStore();

  // 路由预加载策略
  useEffect(() => {
    useRoutePreloader(mode);
  }, [mode]);

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar />
        
        {/* 模式内容 - 使用 Suspense 实现代码分割 */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<PageLoader />}>
            {mode === 'agent' ? <AgentModeLazy /> : <Web3ModeLazy />}
          </Suspense>
        </div>
      </div>
      
      {/* 状态栏 */}
      <StatusBar />
    </div>
  );
}

export default App;
