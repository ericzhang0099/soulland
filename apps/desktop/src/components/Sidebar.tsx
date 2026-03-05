import { useAppStore } from '../stores/appStore';
import { 
  Bot, 
  Globe, 
  MessageSquare, 
  Clock, 
  Radio, 
  Puzzle,
  Chrome,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function Sidebar() {
  const { mode, setMode, sidebarCollapsed, toggleSidebar } = useAppStore();

  const agentMenu = [
    { id: 'chat', icon: MessageSquare, label: 'AI 聊天' },
    { id: 'cron', icon: Clock, label: '定时任务' },
    { id: 'channels', icon: Radio, label: '频道管理' },
    { id: 'skills', icon: Puzzle, label: 'Skill 市场' },
    { id: 'browser', icon: Chrome, label: '浏览器自动化' },
  ];

  const web3Menu = [
    { id: 'market', icon: Globe, label: '基因市场' },
    { id: 'genes', icon: Bot, label: '我的基因' },
    { id: 'training', icon: Clock, label: '训练场' },
    { id: 'leaderboard', icon: Radio, label: '排行榜' },
  ];

  const currentMenu = mode === 'agent' ? agentMenu : web3Menu;

  return (
    <div 
      className={`bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-slate-700">
        {sidebarCollapsed ? (
          <span className="text-xl">🧬</span>
        ) : (
          <span className="text-lg font-bold">GenLoop</span>
        )}
      </div>

      {/* 模式切换 */}
      <div className="p-2">
        <div className="bg-slate-700 rounded-lg p-1 flex">
          <button
            onClick={() => setMode('agent')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'agent' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {sidebarCollapsed ? '🤖' : 'Agent'}
          </button>
          <button
            onClick={() => setMode('web3')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'web3' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {sidebarCollapsed ? '🌐' : 'Web3'}
          </button>
        </div>
      </div>

      {/* 菜单 */}
      <nav className="flex-1 overflow-y-auto py-4">
        {currentMenu.map((item) => (
          <button
            key={item.id}
            className="w-full flex items-center px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <item.icon className="w-5 h-5" />
            {!sidebarCollapsed && (
              <span className="ml-3">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* 底部 */}
      <div className="border-t border-slate-700 p-2">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-white"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-2 text-sm">收起</span>
            </>
          )}
        </button>
        
        <button className="w-full flex items-center px-4 py-3 text-slate-400 hover:text-white mt-2">
          <Settings className="w-5 h-5" />
          {!sidebarCollapsed && <span className="ml-3">设置</span>}
        </button>
      </div>
    </div>
  );
}
