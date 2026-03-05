// 全局类型声明
export {};

declare global {
  interface Window {
    electronAPI: {
      app: {
        getVersion: () => Promise<string>;
        getPlatform: () => Promise<string>;
      };
      shell: {
        openExternal: (url: string) => Promise<void>;
      };
      dialog: {
        showMessage: (options: any) => Promise<any>;
      };
      gateway: {
        start: () => Promise<void>;
        stop: () => Promise<void>;
        restart: () => Promise<void>;
        getStatus: () => Promise<string>;
        onStatusChange: (callback: (status: string) => void) => void;
        getConfig: () => Promise<any>;
        saveConfig: (config: any) => Promise<any>;
        resetConfig: () => Promise<any>;
        testConfig: (config: any) => Promise<{ valid: boolean; error?: string }>;
        getLogs: (options?: any) => Promise<any[]>;
        clearLogs: () => Promise<{ success: boolean }>;
        exportLogs: (targetPath: string) => Promise<{ success: boolean }>;
        getLogPath: () => Promise<string>;
        onLog: (callback: (log: any) => void) => void;
        getHealth: () => Promise<any>;
        onHealth: (callback: (health: any) => void) => void;
      };
      wallet: {
        connect: (walletType: 'metamask' | 'walletconnect' | 'injected') => Promise<string>;
        disconnect: () => Promise<void>;
        getState: () => Promise<{
          isConnected: boolean;
          address: string | null;
          chainId: number | null;
          walletType: 'metamask' | 'walletconnect' | 'injected' | null;
          balance: string | null;
        }>;
        getAddress: () => Promise<string | null>;
        getBalance: () => Promise<{ raw: string; formatted: string; symbol: string } | null>;
        getAddressBalance: (address: string, chainId?: number) => 
          Promise<{ raw: string; formatted: string; symbol: string } | null>;
        signTransaction: (txRequest: {
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
        }) => Promise<string>;
        signMessage: (message: string) => Promise<string>;
        signTypedData: (domain: any, types: any, value: any) => Promise<string>;
        switchNetwork: (chainId: number) => Promise<void>;
        addNetwork: (networkConfig: {
          chainId: number;
          chainName: string;
          rpcUrls: string[];
          nativeCurrency: {
            name: string;
            symbol: string;
            decimals: number;
          };
          blockExplorerUrls?: string[];
        }) => Promise<void>;
        getNetworkInfo: () => Promise<{
          chainId: number;
          name: string;
          rpcUrl: string;
          nativeCurrency: {
            name: string;
            symbol: string;
            decimals: number;
          };
          blockExplorerUrl: string;
        } | null>;
        getSupportedChains: () => Promise<{
          chainId: number;
          name: string;
          rpcUrl: string;
          nativeCurrency: {
            name: string;
            symbol: string;
            decimals: number;
          };
          blockExplorerUrl: string;
        }[]>;
        isValidAddress: (address: string) => Promise<boolean>;
        getAddressChecksum: (address: string) => Promise<string | null>;
        onStateChange: (callback: (state: any) => void) => void;
      };
      cron: {
        getJobs: () => Promise<any[]>;
        createJob: (job: any) => Promise<any>;
        deleteJob: (id: string) => Promise<void>;
        toggleJob: (id: string, enabled: boolean) => Promise<void>;
        getPresets: () => Promise<string[]>;
      };
      browser: {
        launch: (type: 'builtin' | 'chrome') => Promise<void>;
        close: () => Promise<void>;
        executeScript: (scriptId: string) => Promise<any>;
        getScripts: () => Promise<any[]>;
        createScript: (script: any) => Promise<any>;
        deleteScript: (id: string) => Promise<void>;
      };
    };
  }
}
