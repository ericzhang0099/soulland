import { useAppStore } from '../stores/appStore';
import { 
  Circle, 
  Wallet, 
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';

export function StatusBar() {
  const { gatewayStatus, walletAddress } = useAppStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-500';
      case 'starting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="h-8 bg-slate-800 border-t border-slate-700 flex items-center px-4 text-xs text-slate-400">
      {/* 左侧：状态信息 */}
      <div className="flex items-center gap-4">
        {/* Gateway 状态 */}
        <div className="flex items-center gap-1.5">
          <Circle className={`w-2 h-2 fill-current ${getStatusColor(gatewayStatus)}`} />
          <span>Gateway: {gatewayStatus}</span>
        </div>

        {/* 分隔符 */}
        <span className="text-slate-600">|</span>

        {/* 钱包状态 */}
        <div className="flex items-center gap-1.5">
          <Wallet className="w-3 h-3" />
          {walletAddress ? (
            <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          ) : (
            <span className="text-slate-500">未连接</span>
          )}
        </div>

        {/* 分隔符 */}
        <span className="text-slate-600">|</span>

        {/* 网络状态 */}
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-green-500" />
          <span>已连接</span>
        </div>
      </div>

      {/* 右侧：版本信息 */}
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3" />
          <span>区块高度: 18,234,567</span>
        </div>
        
        <span className="text-slate-600">|</span>
        
        <span>v3.0.0</span>
      </div>
    </div>
  );
}
