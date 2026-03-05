import { contextBridge, ipcRenderer } from 'electron';

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPlatform: () => ipcRenderer.invoke('app:get-platform'),
  },
  
  // 系统操作
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  },
  
  // 对话框
  dialog: {
    showMessage: (options: any) => ipcRenderer.invoke('dialog:show-message', options),
  },

  // 托盘管理
  tray: {
    show: () => ipcRenderer.invoke('tray:show'),
    hide: () => ipcRenderer.invoke('tray:hide'),
    toggle: () => ipcRenderer.invoke('tray:toggle'),
    getSettings: () => ipcRenderer.invoke('tray:get-settings'),
    setMinimizeToTray: (value: boolean) => ipcRenderer.invoke('tray:set-minimize-to-tray', value),
  },
  
  // Gateway 管理
  gateway: {
    // 进程管理
    start: () => ipcRenderer.invoke('gateway:start'),
    stop: () => ipcRenderer.invoke('gateway:stop'),
    restart: () => ipcRenderer.invoke('gateway:restart'),
    getStatus: () => ipcRenderer.invoke('gateway:get-status'),
    onStatusChange: (callback: (status: string) => void) => {
      ipcRenderer.on('gateway:status-change', (_, status) => callback(status));
    },
    
    // 配置管理
    getConfig: () => ipcRenderer.invoke('gateway:get-config'),
    saveConfig: (config: any) => ipcRenderer.invoke('gateway:save-config', config),
    resetConfig: () => ipcRenderer.invoke('gateway:reset-config'),
    testConfig: (config: any) => ipcRenderer.invoke('gateway:test-config', config),
    
    // 日志管理
    getLogs: (options?: any) => ipcRenderer.invoke('gateway:get-logs', options),
    clearLogs: () => ipcRenderer.invoke('gateway:clear-logs'),
    exportLogs: (targetPath: string) => ipcRenderer.invoke('gateway:export-logs', targetPath),
    getLogPath: () => ipcRenderer.invoke('gateway:get-log-path'),
    onLog: (callback: (log: any) => void) => {
      ipcRenderer.on('gateway:log', (_, log) => callback(log));
    },
    
    // 健康检查
    getHealth: () => ipcRenderer.invoke('gateway:get-health'),
    onHealth: (callback: (health: any) => void) => {
      ipcRenderer.on('gateway:health', (_, health) => callback(health));
    },
  },
  
  // 钱包
  wallet: {
    connect: (walletType: 'metamask' | 'walletconnect' | 'injected') => 
      ipcRenderer.invoke('wallet:connect', walletType),
    disconnect: () => ipcRenderer.invoke('wallet:disconnect'),
    getState: () => ipcRenderer.invoke('wallet:get-state'),
    getAddress: () => ipcRenderer.invoke('wallet:get-address'),
    getBalance: () => ipcRenderer.invoke('wallet:get-balance'),
    getAddressBalance: (address: string, chainId?: number) => 
      ipcRenderer.invoke('wallet:get-address-balance', address, chainId),
    signTransaction: (txRequest: any) => ipcRenderer.invoke('wallet:sign-transaction', txRequest),
    signMessage: (message: string) => ipcRenderer.invoke('wallet:sign-message', message),
    signTypedData: (domain: any, types: any, value: any) => 
      ipcRenderer.invoke('wallet:sign-typed-data', domain, types, value),
    switchNetwork: (chainId: number) => ipcRenderer.invoke('wallet:switch-network', chainId),
    addNetwork: (networkConfig: any) => ipcRenderer.invoke('wallet:add-network', networkConfig),
    getNetworkInfo: () => ipcRenderer.invoke('wallet:get-network-info'),
    getSupportedChains: () => ipcRenderer.invoke('wallet:get-supported-chains'),
    isValidAddress: (address: string) => ipcRenderer.invoke('wallet:is-valid-address', address),
    getAddressChecksum: (address: string) => ipcRenderer.invoke('wallet:get-address-checksum', address),
    onStateChange: (callback: (state: any) => void) => {
      ipcRenderer.on('wallet:state-change', (_, state) => callback(state));
    },
  },
  
  // Cron 定时任务
  cron: {
    getJobs: () => ipcRenderer.invoke('cron:get-jobs'),
    createJob: (job: any) => ipcRenderer.invoke('cron:create-job', job),
    deleteJob: (id: string) => ipcRenderer.invoke('cron:delete-job', id),
    toggleJob: (id: string, enabled: boolean) => ipcRenderer.invoke('cron:toggle-job', { id, enabled }),
    getPresets: () => ipcRenderer.invoke('cron:get-presets'),
  },
  
  // 浏览器自动化
  browser: {
    launch: (type: 'builtin' | 'chrome') => ipcRenderer.invoke('browser:launch', type),
    close: () => ipcRenderer.invoke('browser:close'),
    executeScript: (scriptId: string) => ipcRenderer.invoke('browser:execute-script', scriptId),
    getScripts: () => ipcRenderer.invoke('browser:get-scripts'),
    createScript: (script: any) => ipcRenderer.invoke('browser:create-script', script),
    deleteScript: (id: string) => ipcRenderer.invoke('browser:delete-script', id),
  },
  
  // 通知中心
  notification: {
    // 发送通知
    send: (options: any) => ipcRenderer.invoke('notification:send', options),
    // 获取通知列表
    getList: (options?: any) => ipcRenderer.invoke('notification:get-list', options),
    // 获取单个通知
    get: (id: string) => ipcRenderer.invoke('notification:get', id),
    // 获取未读数量
    getUnreadCount: () => ipcRenderer.invoke('notification:get-unread-count'),
    // 获取统计信息
    getStats: () => ipcRenderer.invoke('notification:get-stats'),
    // 标记为已读
    markRead: (id: string) => ipcRenderer.invoke('notification:mark-read', id),
    // 标记所有为已读
    markAllRead: () => ipcRenderer.invoke('notification:mark-all-read'),
    // 删除通知
    delete: (id: string) => ipcRenderer.invoke('notification:delete', id),
    // 清空所有通知
    clearAll: () => ipcRenderer.invoke('notification:clear-all'),
    // 清空已读通知
    clearRead: () => ipcRenderer.invoke('notification:clear-read'),
    // 获取设置
    getSettings: () => ipcRenderer.invoke('notification:get-settings'),
    // 保存设置
    saveSettings: (settings: any) => ipcRenderer.invoke('notification:save-settings', settings),
    // 重置设置
    resetSettings: () => ipcRenderer.invoke('notification:reset-settings'),
    // 检查免打扰状态
    isDND: () => ipcRenderer.invoke('notification:is-dnd'),
    // 切换免打扰模式
    toggleDND: () => ipcRenderer.invoke('notification:toggle-dnd'),
    // 监听通知事件
    onReceived: (callback: (notification: any) => void) => {
      ipcRenderer.on('notification:received', (_, notification) => callback(notification));
    },
    onRead: (callback: (data: { id: string }) => void) => {
      ipcRenderer.on('notification:read', (_, data) => callback(data));
    },
    onAllRead: (callback: () => void) => {
      ipcRenderer.on('notification:all-read', () => callback());
    },
    onDeleted: (callback: (data: { id: string }) => void) => {
      ipcRenderer.on('notification:deleted', (_, data) => callback(data));
    },
    onCleared: (callback: () => void) => {
      ipcRenderer.on('notification:cleared', () => callback());
    },
    onClicked: (callback: (notification: any) => void) => {
      ipcRenderer.on('notification:clicked', (_, notification) => callback(notification));
    },
  },
});

// 类型声明
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
      tray: {
        show: () => Promise<{ success: boolean }>;
        hide: () => Promise<{ success: boolean }>;
        toggle: () => Promise<{ success: boolean }>;
        getSettings: () => Promise<{ minimizeToTray: boolean; globalShortcut: string }>;
        setMinimizeToTray: (value: boolean) => Promise<{ success: boolean }>;
      };
      gateway: {
        // 进程管理
        start: () => Promise<void>;
        stop: () => Promise<void>;
        restart: () => Promise<void>;
        getStatus: () => Promise<string>;
        onStatusChange: (callback: (status: string) => void) => void;
        
        // 配置管理
        getConfig: () => Promise<any>;
        saveConfig: (config: any) => Promise<any>;
        resetConfig: () => Promise<any>;
        testConfig: (config: any) => Promise<{ valid: boolean; error?: string }>;
        
        // 日志管理
        getLogs: (options?: any) => Promise<any[]>;
        clearLogs: () => Promise<{ success: boolean }>;
        exportLogs: (targetPath: string) => Promise<{ success: boolean }>;
        getLogPath: () => Promise<string>;
        onLog: (callback: (log: any) => void) => void;
        
        // 健康检查
        getHealth: () => Promise<any>;
        onHealth: (callback: (health: any) => void) => void;
      };
      wallet: {
        connect: (walletType: 'metamask' | 'walletconnect' | 'injected') => 
          Promise<string>;
        disconnect: () => Promise<void>;
        getState: () => Promise<any>;
        getAddress: () => Promise<string | null>;
        getBalance: () => Promise<{ raw: bigint; formatted: string; symbol: string } | null>;
        getAddressBalance: (address: string, chainId?: number) => 
          Promise<{ raw: bigint; formatted: string; symbol: string } | null>;
        signTransaction: (txRequest: any) => Promise<string>;
        signMessage: (message: string) => Promise<string>;
        signTypedData: (domain: any, types: any, value: any) => Promise<string>;
        switchNetwork: (chainId: number) => Promise<void>;
        addNetwork: (networkConfig: any) => Promise<void>;
        getNetworkInfo: () => Promise<any>;
        getSupportedChains: () => Promise<any[]>;
        isValidAddress: (address: string) => Promise<boolean>;
        getAddressChecksum: (address: string) => Promise<string | null>;
        onStateChange: (callback: (state: any) => void) => void;
      };
      browser: {
        launch: (type: 'builtin' | 'chrome') => Promise<void>;
        close: () => Promise<void>;
        executeScript: (scriptId: string) => Promise<any>;
        getScripts: () => Promise<any[]>;
        createScript: (script: any) => Promise<any>;
        deleteScript: (id: string) => Promise<{ success: boolean }>;
      };
      
      // Cron 定时任务
      cron: {
        getJobs: () => Promise<any[]>;
        createJob: (job: any) => Promise<any>;
        deleteJob: (id: string) => Promise<{ success: boolean }>;
        toggleJob: (id: string, enabled: boolean) => Promise<any>;
        getPresets: () => Promise<any[]>;
      };
      // 通知中心
      notification: {
        send: (options: any) => Promise<any>;
        getList: (options?: any) => Promise<any[]>;
        get: (id: string) => Promise<any | null>;
        getUnreadCount: () => Promise<number>;
        getStats: () => Promise<any>;
        markRead: (id: string) => Promise<boolean>;
        markAllRead: () => Promise<number>;
        delete: (id: string) => Promise<boolean>;
        clearAll: () => Promise<number>;
        clearRead: () => Promise<number>;
        getSettings: () => Promise<any>;
        saveSettings: (settings: any) => Promise<any>;
        resetSettings: () => Promise<any>;
        isDND: () => Promise<boolean>;
        toggleDND: () => Promise<boolean>;
        onReceived: (callback: (notification: any) => void) => void;
        onRead: (callback: (data: { id: string }) => void) => void;
        onAllRead: (callback: () => void) => void;
        onDeleted: (callback: (data: { id: string }) => void) => void;
        onCleared: (callback: () => void) => void;
        onClicked: (callback: (notification: any) => void) => void;
      };
    };
  }
}
