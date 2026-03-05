import { 
  Clock, 
  Radio, 
  Puzzle, 
  Chrome,
  Play,
  Square,
  Settings
} from 'lucide-react';

interface ToolsPanelProps {
  activeTool: string | null;
  onSelectTool: (tool: string) => void;
}

export function ToolsPanel({ activeTool, onSelectTool }: ToolsPanelProps) {
  const tools = [
    { id: 'cron', icon: Clock, label: '定时任务', status: '3 个运行中' },
    { id: 'channels', icon: Radio, label: '频道管理', status: '2 个已连接' },
    { id: 'skills', icon: Puzzle, label: 'Skill 市场', status: '5 个已安装' },
    { id: 'browser', icon: Chrome, label: '浏览器自动化', status: '就绪' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* 快捷操作 */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
          <Play className="w-4 h-4" />
          启动 Gateway
        </button>
        <button className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
          <Settings className="w-4 h-4" />
          配置
        </button>
      </div>

      {/* 工具列表 */}
      <div className="space-y-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`w-full p-3 rounded-lg border transition-colors text-left ${
              activeTool === tool.id
                ? 'bg-blue-600/20 border-blue-500'
                : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                activeTool === tool.id ? 'bg-blue-600' : 'bg-slate-600'
              }`}>
                <tool.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{tool.label}</div>
                <div className="text-xs text-slate-400">{tool.status}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 最近活动 */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-slate-400 mb-3">最近活动</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Gateway 启动成功</span>
            <span className="text-slate-500 ml-auto">2分钟前</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Skill 更新完成</span>
            <span className="text-slate-500 ml-auto">1小时前</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 默认导出，用于 React.lazy
export default ToolsPanel;
