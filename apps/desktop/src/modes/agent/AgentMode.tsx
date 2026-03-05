import { useState } from 'react';
import { ChatPanel } from './ChatPanel';
import { ToolsPanel } from './ToolsPanel';

export function AgentMode() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <div className="h-full flex">
      {/* 左侧：聊天面板 */}
      <div className="flex-1 flex flex-col border-r border-slate-700">
        <div className="h-14 border-b border-slate-700 flex items-center px-4">
          <h2 className="text-lg font-semibold">🤖 AI 助手</h2>
        </div>
        <ChatPanel />
      </div>

      {/* 右侧：工具面板 */}
      <div className="w-80 bg-slate-800 flex flex-col">
        <div className="h-14 border-b border-slate-700 flex items-center px-4">
          <h2 className="text-lg font-semibold">🔧 工具箱</h2>
        </div>
        <ToolsPanel 
          activeTool={activeTool}
          onSelectTool={setActiveTool}
        />
      </div>
    </div>
  );
}

// 默认导出，用于 React.lazy
export default AgentMode;
