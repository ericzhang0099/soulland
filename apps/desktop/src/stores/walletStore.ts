import { create } from 'zustand';

// 链配置类型
export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string;
}

// 钱包状态类型
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  walletType: 'metamask' | 'walletconnect' | 'injected' | null;
  balance: string | null;
}

// 余额信息类型
export interface BalanceInfo {
  raw: string;
  formatted: string;
  symbol: string;
}

// 交易请求类型
export interface TransactionRequest {
  to: string;
  from?: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  chainId?: number;
}

// 添加网络请求类型
export interface AddNetworkRequest {
  chainId: number;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls?: string[];
}

// Store 状态
interface WalletStoreState extends WalletState {
  isLoading: boolean;
  error: string | null;
  supportedChains: ChainConfig[];
}

// Store 动作
interface WalletStoreActions {
  // 状态设置
  setState: (state: Partial<WalletState>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSupportedChains: (chains: ChainConfig[]) => void;
  clearError: () => void;

  // 钱包操作
  connect: (walletType: 'metamask' | 'walletconnect' | 'injected') => Promise<string>;
  disconnect: () => Promise<void>;
  refreshState: () => Promise<void>;

  // 余额操作
  getBalance: () => Promise<BalanceInfo | null>;
  getAddressBalance: (address: string, chainId?: number) => Promise<BalanceInfo | null>;

  // 签名操作
  signTransaction: (txRequest: TransactionRequest) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  signTypedData: (domain: any, types: any, value: any) => Promise<string>;

  // 网络操作
  switchNetwork: (chainId: number) => Promise<void>;
  addNetwork: (networkConfig: AddNetworkRequest) => Promise<void>;
  getNetworkInfo: () => Promise<ChainConfig | null>;
  loadSupportedChains: () => Promise<void>;

  // 工具方法
  isValidAddress: (address: string) => Promise<boolean>;
  getAddressChecksum: (address: string) => Promise<string | null>;
  formatAddress: (address: string | null, chars?: number) => string;
}

// 创建 Store
export const useWalletStore = create<WalletStoreState & WalletStoreActions>((set, get) => ({
  // 初始状态
  isConnected: false,
  address: null,
  chainId: null,
  walletType: null,
  balance: null,
  isLoading: false,
  error: null,
  supportedChains: [],

  // 状态设置
  setState: (newState) => set((state) => ({ ...state, ...newState })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSupportedChains: (supportedChains) => set({ supportedChains }),
  clearError: () => set({ error: null }),

  // 连接钱包
  connect: async (walletType) => {
    set({ isLoading: true, error: null });
    try {
      const address = await window.electronAPI.wallet.connect(walletType);
      const state = await window.electronAPI.wallet.getState();
      set({ ...state, isLoading: false });
      return address;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Failed to connect wallet' });
      throw error;
    }
  },

  // 断开连接
  disconnect: async () => {
    set({ isLoading: true, error: null });
    try {
      await window.electronAPI.wallet.disconnect();
      const state = await window.electronAPI.wallet.getState();
      set({ ...state, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Failed to disconnect wallet' });
      throw error;
    }
  },

  // 刷新状态
  refreshState: async () => {
    try {
      const state = await window.electronAPI.wallet.getState();
      set(state);
    } catch (error: any) {
      console.error('Failed to refresh wallet state:', error);
    }
  },

  // 获取余额
  getBalance: async () => {
    try {
      return await window.electronAPI.wallet.getBalance();
    } catch (error: any) {
      set({ error: error.message || 'Failed to get balance' });
      return null;
    }
  },

  // 获取指定地址余额
  getAddressBalance: async (address, chainId) => {
    try {
      return await window.electronAPI.wallet.getAddressBalance(address, chainId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to get address balance' });
      return null;
    }
  },

  // 签名交易
  signTransaction: async (txRequest) => {
    set({ isLoading: true, error: null });
    try {
      const txHash = await window.electronAPI.wallet.signTransaction(txRequest);
      set({ isLoading: false });
      return txHash;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Failed to sign transaction' });
      throw error;
    }
  },

  // 签名消息
  signMessage: async (message) => {
    set({ isLoading: true, error: null });
    try {
      const signature = await window.electronAPI.wallet.signMessage(message);
      set({ isLoading: false });
      return signature;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Failed to sign message' });
      throw error;
    }
  },

  // 签名类型数据
  signTypedData: async (domain, types, value) => {
    set({ isLoading: true, error: null });
    try {
      const signature = await window.electronAPI.wallet.signTypedData(domain, types, value);
      set({ isLoading: false });
      return signature;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Failed to sign typed data' });
      throw error;
    }
  },

  // 切换网络
  switchNetwork: async (chainId) => {
    set({ isLoading: true, error: null });
    try {
      await window.electronAPI.wallet.switchNetwork(chainId);
      const state = await window.electronAPI.wallet.getState();
      set({ ...state, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Failed to switch network' });
      throw error;
    }
  },

  // 添加网络
  addNetwork: async (networkConfig) => {
    set({ isLoading: true, error: null });
    try {
      await window.electronAPI.wallet.addNetwork(networkConfig);
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Failed to add network' });
      throw error;
    }
  },

  // 获取网络信息
  getNetworkInfo: async () => {
    try {
      return await window.electronAPI.wallet.getNetworkInfo();
    } catch (error: any) {
      set({ error: error.message || 'Failed to get network info' });
      return null;
    }
  },

  // 加载支持的链列表
  loadSupportedChains: async () => {
    try {
      const chains = await window.electronAPI.wallet.getSupportedChains();
      set({ supportedChains: chains });
    } catch (error: any) {
      console.error('Failed to load supported chains:', error);
    }
  },

  // 验证地址
  isValidAddress: async (address) => {
    try {
      return await window.electronAPI.wallet.isValidAddress(address);
    } catch {
      return false;
    }
  },

  // 获取格式化地址
  getAddressChecksum: async (address) => {
    try {
      return await window.electronAPI.wallet.getAddressChecksum(address);
    } catch {
      return null;
    }
  },

  // 格式化地址显示
  formatAddress: (address, chars = 4) => {
    if (!address) return '';
    if (address.length <= chars * 2 + 2) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  },
}));

export default useWalletStore;
