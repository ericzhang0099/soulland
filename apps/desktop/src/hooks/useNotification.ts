import { useState, useEffect, useCallback } from 'react';

// 通知类型
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';

// 通知优先级
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

// 通知对象接口
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: NotificationPriority;
  timestamp: Date;
  read: boolean;
  source?: string;
  data?: Record<string, any>;
  icon?: string;
  silent?: boolean;
}

// 通知设置接口
export interface NotificationSettings {
  enabled: boolean;
  doNotDisturb: boolean;
  doNotDisturbStart: string;
  doNotDisturbEnd: string;
  soundEnabled: boolean;
  showInCenter: boolean;
  showInDock: boolean;
  showInTray: boolean;
  typeSettings: {
    info: { enabled: boolean; sound: boolean };
    success: { enabled: boolean; sound: boolean };
    warning: { enabled: boolean; sound: boolean };
    error: { enabled: boolean; sound: boolean };
    system: { enabled: boolean; sound: boolean };
  };
  appSettings: Record<string, { enabled: boolean; priority: NotificationPriority }>;
  maxHistory: number;
  autoCleanup: boolean;
  cleanupDays: number;
}

// 通知统计
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// Hook 返回类型
export interface UseNotificationReturn {
  // 状态
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  settings: NotificationSettings | null;
  isLoading: boolean;
  isDND: boolean;

  // 操作
  sendNotification: (options: {
    title: string;
    body: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    source?: string;
    data?: Record<string, any>;
    icon?: string;
    silent?: boolean;
  }) => Promise<Notification>;
  
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<number>;
  deleteNotification: (id: string) => Promise<boolean>;
  clearAll: () => Promise<number>;
  clearRead: () => Promise<number>;
  
  // 设置
  saveSettings: (settings: Partial<NotificationSettings>) => Promise<NotificationSettings>;
  resetSettings: () => Promise<NotificationSettings>;
  toggleDND: () => Promise<boolean>;
  
  // 刷新
  refreshNotifications: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export function useNotification(): UseNotificationReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDND, setIsDND] = useState(false);

  // 获取通知列表
  const refreshNotifications = useCallback(async (options?: {
    type?: NotificationType;
    priority?: NotificationPriority;
    read?: boolean;
    limit?: number;
  }) => {
    setIsLoading(true);
    try {
      const list = await window.electronAPI.notification.getList(options);
      setNotifications(list.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      })));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取未读数量
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await window.electronAPI.notification.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // 获取统计信息
  const refreshStats = useCallback(async () => {
    try {
      const s = await window.electronAPI.notification.getStats();
      setStats(s);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // 获取设置
  const refreshSettings = useCallback(async () => {
    try {
      const s = await window.electronAPI.notification.getSettings();
      setSettings(s);
      setIsDND(s.doNotDisturb);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, []);

  // 发送通知
  const sendNotification = useCallback(async (options: {
    title: string;
    body: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    source?: string;
    data?: Record<string, any>;
    icon?: string;
    silent?: boolean;
  }) => {
    const notification = await window.electronAPI.notification.send(options);
    await refreshNotifications();
    await refreshUnreadCount();
    await refreshStats();
    return {
      ...notification,
      timestamp: new Date(notification.timestamp),
    };
  }, [refreshNotifications, refreshUnreadCount, refreshStats]);

  // 标记为已读
  const markAsRead = useCallback(async (id: string) => {
    const success = await window.electronAPI.notification.markRead(id);
    if (success) {
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      await refreshUnreadCount();
      await refreshStats();
    }
    return success;
  }, [refreshUnreadCount, refreshStats]);

  // 标记所有为已读
  const markAllAsRead = useCallback(async () => {
    const count = await window.electronAPI.notification.markAllRead();
    if (count > 0) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await refreshUnreadCount();
      await refreshStats();
    }
    return count;
  }, [refreshUnreadCount, refreshStats]);

  // 删除通知
  const deleteNotification = useCallback(async (id: string) => {
    const success = await window.electronAPI.notification.delete(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await refreshUnreadCount();
      await refreshStats();
    }
    return success;
  }, [refreshUnreadCount, refreshStats]);

  // 清空所有
  const clearAll = useCallback(async () => {
    const count = await window.electronAPI.notification.clearAll();
    if (count > 0) {
      setNotifications([]);
      await refreshUnreadCount();
      await refreshStats();
    }
    return count;
  }, [refreshUnreadCount, refreshStats]);

  // 清空已读
  const clearRead = useCallback(async () => {
    const count = await window.electronAPI.notification.clearRead();
    if (count > 0) {
      setNotifications(prev => prev.filter(n => !n.read));
      await refreshStats();
    }
    return count;
  }, [refreshStats]);

  // 保存设置
  const saveSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    const saved = await window.electronAPI.notification.saveSettings(newSettings);
    setSettings(saved);
    setIsDND(saved.doNotDisturb);
    return saved;
  }, []);

  // 重置设置
  const resetSettings = useCallback(async () => {
    const reset = await window.electronAPI.notification.resetSettings();
    setSettings(reset);
    setIsDND(reset.doNotDisturb);
    return reset;
  }, []);

  // 切换免打扰
  const toggleDND = useCallback(async () => {
    const newState = await window.electronAPI.notification.toggleDND();
    setIsDND(newState);
    if (settings) {
      setSettings({ ...settings, doNotDisturb: newState });
    }
    return newState;
  }, [settings]);

  // 监听实时通知
  useEffect(() => {
    if (!window.electronAPI?.notification) return;

    const handleReceived = (notification: any) => {
      const n = { ...notification, timestamp: new Date(notification.timestamp) };
      setNotifications(prev => [n, ...prev]);
      refreshUnreadCount();
      refreshStats();
    };

    const handleRead = ({ id }: { id: string }) => {
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      refreshUnreadCount();
    };

    const handleAllRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      refreshUnreadCount();
    };

    const handleDeleted = ({ id }: { id: string }) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      refreshUnreadCount();
    };

    const handleCleared = () => {
      setNotifications([]);
      refreshUnreadCount();
    };

    window.electronAPI.notification.onReceived(handleReceived);
    window.electronAPI.notification.onRead(handleRead);
    window.electronAPI.notification.onAllRead(handleAllRead);
    window.electronAPI.notification.onDeleted(handleDeleted);
    window.electronAPI.notification.onCleared(handleCleared);

    // 初始加载
    refreshNotifications();
    refreshUnreadCount();
    refreshStats();
    refreshSettings();

    return () => {
      // Electron IPC 监听器无法直接移除，这里只是占位
    };
  }, [refreshNotifications, refreshUnreadCount, refreshStats, refreshSettings]);

  return {
    notifications,
    unreadCount,
    stats,
    settings,
    isLoading,
    isDND,
    sendNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    clearRead,
    saveSettings,
    resetSettings,
    toggleDND,
    refreshNotifications,
    refreshStats,
    refreshSettings,
  };
}

export type { NotificationType, NotificationPriority, Notification, NotificationSettings, NotificationStats };
export default useNotification;
