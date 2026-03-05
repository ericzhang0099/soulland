import { useEffect, useState, useCallback } from 'react';

// 钱包状态类型
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  walletType: 'metamask' | 'walletconnect' | 'injected' | null;
  balance: string | null;
}

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

// 余额信息类型
export interface BalanceInfo {
  raw: string;
  formatted: string;
  symbol: string;
}

/**
 * 钱包 Hook
 * 提供钱包连接、签名、网络切换等功能
 */
export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    walletType: null,
    balance: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取初始状态
  useEffect(() => {
    const initWallet = async () => {
      try {
        const walletState = await window.electronAPI.wallet.getState();
        setState(walletState);
      } catch (err) {
        console.error('Failed to get wallet state:', err);
      }
    };

    initWallet();

    // 监听状态变化
    window.electronAPI.wallet.onStateChange((newState: WalletState) => {
      setState(newState);
    });
  }, []);

  /**
   * 连接钱包
   */
  const connect = useCallback(async (walletType: 'metamask' | 'walletconnect' | 'injected') => {
    setIsLoading(true);
    setError(null);

    try {
      const address = await window.electronAPI.wallet.connect(walletType);
      const newState = await window.electronAPI.wallet.getState();
      setState(newState);
      return address;
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 断开钱包连接
   */
  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await window.electronAPI.wallet.disconnect();
      const newState = await window.electronAPI.wallet.getState();
      setState(newState);
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect wallet');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 获取余额
   */
  const getBalance = useCallback(async (): Promise<BalanceInfo | null> => {
    try {
      const balance = await window.electronAPI.wallet.getBalance();
      return balance;
    } catch (err: any) {
      setError(err.message || 'Failed to get balance');
      return null;
    }
  }, []);

  /**
   * 获取指定地址余额
   */
  const getAddressBalance = useCallback(async (address: string, chainId?: number): Promise<BalanceInfo | null> => {
    try {
      const balance = await window.electronAPI.wallet.getAddressBalance(address, chainId);
      return balance;
    } catch (err: any) {
      setError(err.message || 'Failed to get address balance');
      return null;
    }
  }, []);

  /**
   * 签名交易
   */
  const signTransaction = useCallback(async (txRequest: TransactionRequest): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const txHash = await window.electronAPI.wallet.signTransaction(txRequest);
      return txHash;
    } catch (err: any) {
      setError(err.message || 'Failed to sign transaction');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 签名消息
   */
  const signMessage = useCallback(async (message: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const signature = await window.electronAPI.wallet.signMessage(message);
      return signature;
    } catch (err: any) {
      setError(err.message || 'Failed to sign message');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 签名类型数据 (EIP-712)
   */
  const signTypedData = useCallback(async (
    domain: any,
    types: any,
    value: any
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const signature = await window.electronAPI.wallet.signTypedData(domain, types, value);
      return signature;
    } catch (err: any) {
      setError(err.message || 'Failed to sign typed data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 切换网络
   */
  const switchNetwork = useCallback(async (chainId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await window.electronAPI.wallet.switchNetwork(chainId);
      const newState = await window.electronAPI.wallet.getState();
      setState(newState);
    } catch (err: any) {
      setError(err.message || 'Failed to switch network');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 获取当前网络信息
   */
  const getNetworkInfo = useCallback(async (): Promise<ChainConfig | null> => {
    try {
      const networkInfo = await window.electronAPI.wallet.getNetworkInfo();
      return networkInfo;
    } catch (err: any) {
      setError(err.message || 'Failed to get network info');
      return null;
    }
  }, []);

  /**
   * 获取支持的链列表
   */
  const getSupportedChains = useCallback(async (): Promise<ChainConfig[]> => {
    try {
      const chains = await window.electronAPI.wallet.getSupportedChains();
      return chains;
    } catch (err: any) {
      setError(err.message || 'Failed to get supported chains');
      return [];
    }
  }, []);

  /**
   * 验证地址
   */
  const isValidAddress = useCallback(async (address: string): Promise<boolean> => {
    try {
      return await window.electronAPI.wallet.isValidAddress(address);
    } catch {
      return false;
    }
  }, []);

  /**
   * 获取格式化地址 (checksum)
   */
  const getAddressChecksum = useCallback(async (address: string): Promise<string | null> => {
    try {
      return await window.electronAPI.wallet.getAddressChecksum(address);
    } catch {
      return null;
    }
  }, []);

  /**
   * 格式化地址显示 (0x1234...5678)
   */
  const formatAddress = useCallback((address: string | null, chars = 4): string => {
    if (!address) return '';
    if (address.length <= chars * 2 + 2) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  }, []);

  return {
    // 状态
    ...state,
    isLoading,
    error,

    // 方法
    connect,
    disconnect,
    getBalance,
    getAddressBalance,
    signTransaction,
    signMessage,
    signTypedData,
    switchNetwork,
    getNetworkInfo,
    getSupportedChains,
    isValidAddress,
    getAddressChecksum,
    formatAddress,
  };
}

export default useWallet;
