import { useState, useEffect } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { 
  Wallet, 
  LogOut, 
  ChevronDown, 
  Check, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

// 支持的链图标映射
const CHAIN_ICONS: Record<number, string> = {
  1: '🔷', // Ethereum
  137: '💜', // Polygon
  80002: '💜', // Polygon Amoy
  11155111: '🔷', // Sepolia
  31337: '⚙️', // Hardhat
};

// 钱包类型配置
const WALLET_OPTIONS = [
  {
    id: 'metamask' as const,
    name: 'MetaMask',
    description: 'Connect to your MetaMask wallet',
    icon: '🦊',
  },
  {
    id: 'walletconnect' as const,
    name: 'WalletConnect',
    description: 'Scan with WalletConnect to connect',
    icon: '🔗',
  },
];

export function WalletBar() {
  const {
    isConnected,
    address,
    chainId,
    balance,
    walletType,
    isLoading,
    error,
    supportedChains,
    connect,
    disconnect,
    switchNetwork,
    loadSupportedChains,
    formatAddress,
  } = useWalletStore();

  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // 加载支持的链
  useEffect(() => {
    loadSupportedChains();
  }, [loadSupportedChains]);

  // 处理连接
  const handleConnect = async (walletId: 'metamask' | 'walletconnect') => {
    try {
      await connect(walletId);
      setIsConnectDialogOpen(false);
    } catch (err) {
      // 错误已在 store 中处理
    }
  };

  // 处理断开连接
  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      // 错误已在 store 中处理
    }
  };

  // 处理网络切换
  const handleSwitchNetwork = async (newChainId: number) => {
    try {
      await switchNetwork(newChainId);
    } catch (err) {
      // 错误已在 store 中处理
    }
  };

  // 复制地址到剪贴板
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 打开区块浏览器
  const openExplorer = () => {
    if (address && chainId) {
      const chain = supportedChains.find(c => c.chainId === chainId);
      if (chain?.blockExplorerUrl) {
        window.electronAPI.shell.openExternal(`${chain.blockExplorerUrl}/address/${address}`);
      }
    }
  };

  // 获取当前链信息
  const currentChain = supportedChains.find(c => c.chainId === chainId);

  // 未连接状态
  if (!isConnected) {
    return (
      <>
        <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              Connect Wallet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>
                Choose your preferred wallet to connect to GenLoop Desktop
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {WALLET_OPTIONS.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleConnect(wallet.id)}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-all",
                    "hover:bg-accent hover:border-accent-foreground/20",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{wallet.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {wallet.description}
                    </p>
                  </div>
                  {isLoading && walletType === wallet.id && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 已连接状态
  return (
    <div className="flex items-center gap-2">
      {/* 网络选择器 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <span>{CHAIN_ICONS[chainId || 137] || '🔗'}</span>
            <span className="hidden sm:inline">{currentChain?.name || 'Unknown'}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {supportedChains.map((chain) => (
            <DropdownMenuItem
              key={chain.chainId}
              onClick={() => handleSwitchNetwork(chain.chainId)}
              className="gap-2"
            >
              <span>{CHAIN_ICONS[chain.chainId] || '🔗'}</span>
              <span className="flex-1">{chain.name}</span>
              {chainId === chain.chainId && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 钱包地址/余额显示 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{formatAddress(address)}</span>
            <span className="sm:hidden">{formatAddress(address, 2)}</span>
            {balance && (
              <span className="text-muted-foreground">
                ({parseFloat(balance).toFixed(4)} {currentChain?.nativeCurrency.symbol})
              </span>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-medium">
            Connected Wallet
          </div>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={copyAddress} className="gap-2">
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Address</span>
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={openExplorer} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            <span>View on Explorer</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleDisconnect}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// 默认导出，用于 React.lazy
export default WalletBar;
