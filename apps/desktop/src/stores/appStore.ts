import { create } from 'zustand';
import { configCache } from '../lib/cache';

interface AppState {
  // 当前模式
  mode: 'agent' | 'web3';
  setMode: (mode: 'agent' | 'web3') => void;
  
  // Gateway 状态
  gatewayStatus: 'stopped' | 'starting' | 'running' | 'error';
  setGatewayStatus: (status: AppState['gatewayStatus']) => void;
  
  // 钱包状态
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  
  // 侧边栏折叠
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // 初始化状态
  initialize: () => void;
}

const CACHE_KEY = 'appState';

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  mode: 'agent',
  setMode: (mode) => {
    set({ mode });
    // 缓存用户偏好
    configCache.set(CACHE_KEY, { mode }, null);
  },
  
  gatewayStatus: 'stopped',
  setGatewayStatus: (status) => set({ gatewayStatus: status }),
  
  walletAddress: null,
  setWalletAddress: (address) => set({ walletAddress: address }),
  
  sidebarCollapsed: false,
  toggleSidebar: () => {
    const newState = !get().sidebarCollapsed;
    set({ sidebarCollapsed: newState });
    // 缓存侧边栏状态
    configCache.set(CACHE_KEY, { sidebarCollapsed: newState }, null);
  },

  // 从缓存初始化状态
  initialize: () => {
    const cached = configCache.get<{ mode?: 'agent' | 'web3'; sidebarCollapsed?: boolean }>(CACHE_KEY);
    if (cached) {
      set((state) => ({
        mode: cached.mode ?? state.mode,
        sidebarCollapsed: cached.sidebarCollapsed ?? state.sidebarCollapsed,
      }));
    }
  },
}));

export default useAppStore;
