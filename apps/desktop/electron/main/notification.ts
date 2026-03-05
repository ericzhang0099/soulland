/**
 * 通知中心模块
 * 负责管理本地通知、通知历史记录和通知设置
 */

import { app, ipcMain, BrowserWindow, Notification as ElectronNotification } from 'electron';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
  // 全局开关
  enabled: boolean;
  // 免打扰模式
  doNotDisturb: boolean;
  // 免打扰时间段
  doNotDisturbStart: string; // HH:mm 格式
  doNotDisturbEnd: string;   // HH:mm 格式
  // 声音设置
  soundEnabled: boolean;
  // 桌面通知设置
  showInCenter: boolean;
  showInDock: boolean;
  showInTray: boolean;
  // 各类型通知开关
  typeSettings: {
    info: { enabled: boolean; sound: boolean };
    success: { enabled: boolean; sound: boolean };
    warning: { enabled: boolean; sound: boolean };
    error: { enabled: boolean; sound: boolean };
    system: { enabled: boolean; sound: boolean };
  };
  // 应用特定设置
  appSettings: Record<string, { enabled: boolean; priority: NotificationPriority }>;
  // 历史记录设置
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

// 默认设置
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  doNotDisturb: false,
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '08:00',
  soundEnabled: true,
  showInCenter: true,
  showInDock: true,
  showInTray: true,
  typeSettings: {
    info: { enabled: true, sound: false },
    success: { enabled: true, sound: true },
    warning: { enabled: true, sound: true },
    error: { enabled: true, sound: true },
    system: { enabled: true, sound: true },
  },
  appSettings: {},
  maxHistory: 1000,
  autoCleanup: true,
  cleanupDays: 30,
};

// 通知管理器类
export class NotificationManager extends EventEmitter {
  private notifications: Map<string, Notification> = new Map();
  private settings: NotificationSettings;
  private settingsPath: string;
  private historyPath: string;
  private mainWindow: BrowserWindow | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();

    // 初始化路径
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'notification-settings.json');
    this.historyPath = path.join(userDataPath, 'notification-history.json');

    // 加载设置
    this.settings = this.loadSettings();

    // 加载历史记录
    this.loadHistory();

    // 设置 IPC 处理器
    this.setupIpcHandlers();

    // 启动自动清理
    this.startAutoCleanup();

    // 应用退出时保存
    app.on('before-quit', () => {
      this.saveHistory();
    });
  }

  /**
   * 设置主窗口引用
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  // ==================== 设置管理 ====================

  /**
   * 加载设置
   */
  private loadSettings(): NotificationSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        const saved = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...saved };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * 保存设置
   */
  saveSettings(settings?: Partial<NotificationSettings>): NotificationSettings {
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }

    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
      this.emit('settingsChange', this.settings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }

    return this.settings;
  }

  /**
   * 获取当前设置
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * 重置设置为默认值
   */
  resetSettings(): NotificationSettings {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    this.emit('settingsChange', this.settings);
    return this.settings;
  }

  // ==================== 历史记录管理 ====================

  /**
   * 加载历史记录
   */
  private loadHistory() {
    try {
      if (fs.existsSync(this.historyPath)) {
        const data = fs.readFileSync(this.historyPath, 'utf-8');
        const history: Notification[] = JSON.parse(data);
        
        history.forEach(n => {
          n.timestamp = new Date(n.timestamp);
          this.notifications.set(n.id, n);
        });

        // 限制历史记录数量
        this.enforceMaxHistory();
      }
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  }

  /**
   * 保存历史记录
   */
  private saveHistory() {
    try {
      const history = Array.from(this.notifications.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.settings.maxHistory);
      
      fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Failed to save notification history:', error);
    }
  }

  /**
   * 限制历史记录数量
   */
  private enforceMaxHistory() {
    if (this.notifications.size > this.settings.maxHistory) {
      const sorted = Array.from(this.notifications.entries())
        .sort((a, b) => b[1].timestamp.getTime() - a[1].timestamp.getTime());
      
      const toDelete = sorted.slice(this.settings.maxHistory);
      toDelete.forEach(([id]) => this.notifications.delete(id));
    }
  }

  // ==================== 通知发送 ====================

  /**
   * 发送通知
   */
  async notify(options: {
    title: string;
    body: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    source?: string;
    data?: Record<string, any>;
    icon?: string;
    silent?: boolean;
  }): Promise<Notification> {
    const {
      title,
      body,
      type = 'info',
      priority = 'normal',
      source = 'system',
      data,
      icon,
      silent,
    } = options;

    // 检查是否允许发送此类型通知
    if (!this.canNotify(type, priority, source)) {
      throw new Error('Notification blocked by settings');
    }

    // 创建通知对象
    const notification: Notification = {
      id: this.generateId(),
      title,
      body,
      type,
      priority,
      timestamp: new Date(),
      read: false,
      source,
      data,
      icon: icon || this.getDefaultIcon(type),
      silent: silent ?? !this.settings.typeSettings[type].sound,
    };

    // 保存到历史记录
    this.notifications.set(notification.id, notification);
    this.enforceMaxHistory();
    this.saveHistory();

    // 发送系统通知
    await this.sendSystemNotification(notification);

    // 通知渲染进程
    this.notifyRenderer('notification:received', notification);

    // 触发事件
    this.emit('notification', notification);

    return notification;
  }

  /**
   * 检查是否可以发送通知
   */
  private canNotify(type: NotificationType, priority: NotificationPriority, source: string): boolean {
    // 检查全局开关
    if (!this.settings.enabled) {
      return false;
    }

    // 检查免打扰模式
    if (this.isDoNotDisturb() && priority !== 'critical') {
      return false;
    }

    // 检查类型设置
    if (!this.settings.typeSettings[type].enabled) {
      return false;
    }

    // 检查应用特定设置
    const appSetting = this.settings.appSettings[source];
    if (appSetting && !appSetting.enabled) {
      return false;
    }

    return true;
  }

  /**
   * 检查是否在免打扰时间段
   */
  private isDoNotDisturb(): boolean {
    if (!this.settings.doNotDisturb) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.settings.doNotDisturbStart.split(':').map(Number);
    const [endHour, endMin] = this.settings.doNotDisturbEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // 跨午夜的情况
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * 发送系统通知
   */
  private async sendSystemNotification(notification: Notification): Promise<void> {
    // 检查系统通知权限
    if (!ElectronNotification.isSupported()) {
      console.warn('System notifications are not supported');
      return;
    }

    // 创建 Electron 通知
    const electronNotif = new ElectronNotification({
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      silent: notification.silent,
      urgency: this.mapPriorityToUrgency(notification.priority),
    });

    // 处理点击事件
    electronNotif.on('click', () => {
      this.handleNotificationClick(notification.id);
    });

    // 显示通知
    electronNotif.show();

    // 更新 Dock 角标（macOS）
    if (this.settings.showInDock && process.platform === 'darwin') {
      const unreadCount = this.getUnreadCount();
      app.setBadgeCount(unreadCount);
    }
  }

  /**
   * 映射优先级到系统紧急程度
   */
  private mapPriorityToUrgency(priority: NotificationPriority): 'normal' | 'critical' | 'low' {
    switch (priority) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'critical';
      case 'low':
        return 'low';
      default:
        return 'normal';
    }
  }

  /**
   * 获取默认图标
   */
  private getDefaultIcon(type: NotificationType): string {
    // 返回应用图标路径
    const iconMap: Record<NotificationType, string> = {
      info: '🔵',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      system: '⚙️',
    };
    return iconMap[type];
  }

  /**
   * 处理通知点击
   */
  private handleNotificationClick(id: string) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    // 标记为已读
    this.markAsRead(id);

    // 聚焦主窗口
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
      this.mainWindow.webContents.send('notification:clicked', notification);
    }

    this.emit('notificationClicked', notification);
  }

  // ==================== 通知查询 ====================

  /**
   * 获取所有通知
   */
  getNotifications(options?: {
    type?: NotificationType;
    priority?: NotificationPriority;
    read?: boolean;
    source?: string;
    limit?: number;
    offset?: number;
  }): Notification[] {
    let list = Array.from(this.notifications.values());

    if (options?.type) {
      list = list.filter(n => n.type === options.type);
    }

    if (options?.priority) {
      list = list.filter(n => n.priority === options.priority);
    }

    if (options?.read !== undefined) {
      list = list.filter(n => n.read === options.read);
    }

    if (options?.source) {
      list = list.filter(n => n.source === options.source);
    }

    // 按时间倒序排序
    list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // 分页
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? list.length;
    list = list.slice(offset, offset + limit);

    return list;
  }

  /**
   * 获取单个通知
   */
  getNotification(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  /**
   * 获取未读数量
   */
  getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter(n => !n.read).length;
  }

  /**
   * 获取统计信息
   */
  getStats(): NotificationStats {
    const stats: NotificationStats = {
      total: this.notifications.size,
      unread: 0,
      byType: { info: 0, success: 0, warning: 0, error: 0, system: 0 },
      byPriority: { low: 0, normal: 0, high: 0, critical: 0 },
    };

    this.notifications.forEach(n => {
      if (!n.read) stats.unread++;
      stats.byType[n.type]++;
      stats.byPriority[n.priority]++;
    });

    return stats;
  }

  // ==================== 通知操作 ====================

  /**
   * 标记为已读
   */
  markAsRead(id: string): boolean {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    notification.read = true;
    this.saveHistory();
    this.notifyRenderer('notification:read', { id });
    this.emit('notificationRead', notification);

    // 更新 Dock 角标
    if (process.platform === 'darwin') {
      app.setBadgeCount(this.getUnreadCount());
    }

    return true;
  }

  /**
   * 标记所有为已读
   */
  markAllAsRead(): number {
    let count = 0;
    this.notifications.forEach(n => {
      if (!n.read) {
        n.read = true;
        count++;
      }
    });

    if (count > 0) {
      this.saveHistory();
      this.notifyRenderer('notification:all-read', {});
      this.emit('allNotificationsRead', count);

      // 更新 Dock 角标
      if (process.platform === 'darwin') {
        app.setBadgeCount(0);
      }
    }

    return count;
  }

  /**
   * 删除通知
   */
  deleteNotification(id: string): boolean {
    const deleted = this.notifications.delete(id);
    if (deleted) {
      this.saveHistory();
      this.notifyRenderer('notification:deleted', { id });
      this.emit('notificationDeleted', id);
    }
    return deleted;
  }

  /**
   * 清空所有通知
   */
  clearAll(): number {
    const count = this.notifications.size;
    this.notifications.clear();
    this.saveHistory();
    this.notifyRenderer('notification:cleared', {});
    this.emit('notificationsCleared', count);

    // 更新 Dock 角标
    if (process.platform === 'darwin') {
      app.setBadgeCount(0);
    }

    return count;
  }

  /**
   * 清空已读通知
   */
  clearRead(): number {
    let count = 0;
    for (const [id, n] of this.notifications) {
      if (n.read) {
        this.notifications.delete(id);
        count++;
      }
    }

    if (count > 0) {
      this.saveHistory();
      this.notifyRenderer('notification:read-cleared', { count });
      this.emit('readNotificationsCleared', count);
    }

    return count;
  }

  // ==================== 自动清理 ====================

  /**
   * 启动自动清理
   */
  private startAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // 每天检查一次
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 24 * 60 * 60 * 1000);

    // 立即执行一次
    this.performCleanup();
  }

  /**
   * 执行清理
   */
  private performCleanup() {
    if (!this.settings.autoCleanup) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.settings.cleanupDays);

    let count = 0;
    for (const [id, n] of this.notifications) {
      if (n.read && n.timestamp < cutoffDate) {
        this.notifications.delete(id);
        count++;
      }
    }

    if (count > 0) {
      this.saveHistory();
      this.emit('notificationsAutoCleaned', count);
    }
  }

  // ==================== 快捷方法 ====================

  /**
   * 发送信息通知
   */
  info(title: string, body: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'body' | 'type'>>) {
    return this.notify({ title, body, type: 'info', ...options });
  }

  /**
   * 发送成功通知
   */
  success(title: string, body: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'body' | 'type'>>) {
    return this.notify({ title, body, type: 'success', ...options });
  }

  /**
   * 发送警告通知
   */
  warning(title: string, body: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'body' | 'type'>>) {
    return this.notify({ title, body, type: 'warning', priority: 'high', ...options });
  }

  /**
   * 发送错误通知
   */
  error(title: string, body: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'body' | 'type'>>) {
    return this.notify({ title, body, type: 'error', priority: 'high', ...options });
  }

  /**
   * 发送系统通知
   */
  system(title: string, body: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'body' | 'type'>>) {
    return this.notify({ title, body, type: 'system', ...options });
  }

  // ==================== 工具方法 ====================

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 通知渲染进程
   */
  private notifyRenderer(channel: string, data: any) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  // ==================== IPC 处理器 ====================

  /**
   * 设置 IPC 处理器
   */
  private setupIpcHandlers() {
    // 发送通知
    ipcMain.handle('notification:send', async (_, options) => {
      const notification = await this.notify(options);
      return notification;
    });

    // 获取通知列表
    ipcMain.handle('notification:get-list', (_, options) => {
      return this.getNotifications(options);
    });

    // 获取单个通知
    ipcMain.handle('notification:get', (_, id) => {
      return this.getNotification(id);
    });

    // 获取未读数量
    ipcMain.handle('notification:get-unread-count', () => {
      return this.getUnreadCount();
    });

    // 获取统计信息
    ipcMain.handle('notification:get-stats', () => {
      return this.getStats();
    });

    // 标记为已读
    ipcMain.handle('notification:mark-read', (_, id) => {
      return this.markAsRead(id);
    });

    // 标记所有为已读
    ipcMain.handle('notification:mark-all-read', () => {
      return this.markAllAsRead();
    });

    // 删除通知
    ipcMain.handle('notification:delete', (_, id) => {
      return this.deleteNotification(id);
    });

    // 清空所有通知
    ipcMain.handle('notification:clear-all', () => {
      return this.clearAll();
    });

    // 清空已读通知
    ipcMain.handle('notification:clear-read', () => {
      return this.clearRead();
    });

    // 获取设置
    ipcMain.handle('notification:get-settings', () => {
      return this.getSettings();
    });

    // 保存设置
    ipcMain.handle('notification:save-settings', (_, settings) => {
      return this.saveSettings(settings);
    });

    // 重置设置
    ipcMain.handle('notification:reset-settings', () => {
      return this.resetSettings();
    });

    // 检查免打扰状态
    ipcMain.handle('notification:is-dnd', () => {
      return this.isDoNotDisturb();
    });

    // 切换免打扰模式
    ipcMain.handle('notification:toggle-dnd', () => {
      const newState = !this.settings.doNotDisturb;
      this.saveSettings({ doNotDisturb: newState });
      return newState;
    });
  }
}

// 导出单例实例
export const notificationManager = new NotificationManager();
export default notificationManager;
