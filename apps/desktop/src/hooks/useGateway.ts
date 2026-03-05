/**
 * Gateway 管理 Hook
 * 用于在 React 组件中管理 Gateway 进程
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// 类型定义
export type GatewayStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

export interface GatewayConfig {
  port: number;
  host: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logPath: string;
  maxLogSize: number;
  maxLogFiles: number;
  maxWorkers: number;
  requestTimeout: number;
  enableBrowser: boolean;
  enableChannels: boolean;
  enableSkills: boolean;
  env: Record<string, string>;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source: 'gateway' | 'system';
}

export interface GatewayHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
  cpu: number;
  lastCheck: string;
  checks: {
    process: boolean;
    http: boolean;
    websocket: boolean;
  };
}

export interface UseGatewayReturn {
  // 状态
  status: GatewayStatus;
  isLoading: boolean;
  error: string | null;
  
  // 配置
  config: GatewayConfig | null;
  isConfigLoading: boolean;
  
  // 日志
  logs: LogEntry[];
  logPath: string | null;
  
  // 健康
  health: GatewayHealth | null;
  
  // 操作
  start: () => Promise<void>;
  stop: () => Promise<void>;
  restart: () => Promise<void>;
  saveConfig: (config: Partial<GatewayConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  testConfig: (config: Partial<GatewayConfig>) => Promise<{ valid: boolean; error?: string }>;
  clearLogs: () => Promise<void>;
  exportLogs: (targetPath: string) => Promise<boolean>;
  refreshLogs: () => Promise<void>;
  refreshConfig: () => Promise<void>;
}

export function useGateway(): UseGatewayReturn {
  const [status, setStatus] = useState<GatewayStatus>('stopped');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logPath, setLogPath] = useState<string | null>(null);
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  
  const logsRef = useRef<LogEntry[]>([]);

  // 获取 electronAPI
  const api = typeof window !== 'undefined' ? window.electronAPI?.gateway : null;

  // 初始化：获取初始状态
  useEffect(() => {
    if (!api) return;

    // 获取初始状态
    api.getStatus().then(setStatus);
    api.getConfig().then(setConfig);
    api.getLogPath().then(setLogPath);
    api.getHealth().then(setHealth);
    api.getLogs({ limit: 100 }).then(setLogs);

    // 监听状态变化
    const unsubscribeStatus = api.onStatusChange((newStatus) => {
      setStatus(newStatus as GatewayStatus);
    });

    // 监听日志
    const unsubscribeLog = api.onLog((log: LogEntry) => {
      logsRef.current = [...logsRef.current, log].slice(-1000);
      setLogs(logsRef.current);
    });

    // 监听健康状态
    const unsubscribeHealth = api.onHealth((newHealth: GatewayHealth) => {
      setHealth(newHealth);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeLog();
      unsubscribeHealth();
    };
  }, [api]);

  // 启动 Gateway
  const start = useCallback(async () => {
    if (!api) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await api.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Gateway');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  // 停止 Gateway
  const stop = useCallback(async () => {
    if (!api) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await api.stop();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop Gateway');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  // 重启 Gateway
  const restart = useCallback(async () => {
    if (!api) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await api.restart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restart Gateway');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  // 保存配置
  const saveConfig = useCallback(async (newConfig: Partial<GatewayConfig>) => {
    if (!api) return;
    
    setIsConfigLoading(true);
    setError(null);
    
    try {
      const updated = await api.saveConfig(newConfig);
      setConfig(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save config');
    } finally {
      setIsConfigLoading(false);
    }
  }, [api]);

  // 重置配置
  const resetConfig = useCallback(async () => {
    if (!api) return;
    
    setIsConfigLoading(true);
    setError(null);
    
    try {
      const defaultConfig = await api.resetConfig();
      setConfig(defaultConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset config');
    } finally {
      setIsConfigLoading(false);
    }
  }, [api]);

  // 测试配置
  const testConfig = useCallback(async (testConfig: Partial<GatewayConfig>) => {
    if (!api) return { valid: false, error: 'API not available' };
    
    try {
      return await api.testConfig(testConfig);
    } catch (err) {
      return { 
        valid: false, 
        error: err instanceof Error ? err.message : 'Config test failed' 
      };
    }
  }, [api]);

  // 清空日志
  const clearLogs = useCallback(async () => {
    if (!api) return;
    
    try {
      await api.clearLogs();
      logsRef.current = [];
      setLogs([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear logs');
    }
  }, [api]);

  // 导出日志
  const exportLogs = useCallback(async (targetPath: string) => {
    if (!api) return false;
    
    try {
      const result = await api.exportLogs(targetPath);
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export logs');
      return false;
    }
  }, [api]);

  // 刷新日志
  const refreshLogs = useCallback(async () => {
    if (!api) return;
    
    try {
      const newLogs = await api.getLogs({ limit: 100 });
      logsRef.current = newLogs;
      setLogs(newLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh logs');
    }
  }, [api]);

  // 刷新配置
  const refreshConfig = useCallback(async () => {
    if (!api) return;
    
    setIsConfigLoading(true);
    
    try {
      const newConfig = await api.getConfig();
      setConfig(newConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh config');
    } finally {
      setIsConfigLoading(false);
    }
  }, [api]);

  return {
    status,
    isLoading,
    error,
    config,
    isConfigLoading,
    logs,
    logPath,
    health,
    start,
    stop,
    restart,
    saveConfig,
    resetConfig,
    testConfig,
    clearLogs,
    exportLogs,
    refreshLogs,
    refreshConfig,
  };
}

export default useGateway;
