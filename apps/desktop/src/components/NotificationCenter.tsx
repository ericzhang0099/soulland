import React, { useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import type { NotificationType } from '../hooks/useNotification';
import { 
  Bell, 
  BellOff, 
  Check, 
  Trash2, 
  Settings, 
  X,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Settings2
} from 'lucide-react';

// 类型图标映射
const typeIcons: Record<NotificationType, React.ReactNode> = {
  info: <Info className="w-4 h-4 text-blue-500" />,
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
  system: <Settings2 className="w-4 h-4 text-gray-500" />,
};

// 类型样式映射
const typeStyles: Record<NotificationType, string> = {
  info: 'border-l-blue-500 bg-blue-50/50',
  success: 'border-l-green-500 bg-green-50/50',
  warning: 'border-l-yellow-500 bg-yellow-50/50',
  error: 'border-l-red-500 bg-red-50/50',
  system: 'border-l-gray-500 bg-gray-50/50',
};

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  
  const {
    notifications,
    unreadCount,
    stats,
    settings,
    isLoading,
    isDND,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    clearRead,
    saveSettings,
    toggleDND,
    refreshNotifications,
  } = useNotification();

  // 过滤通知
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="relative">
      {/* 通知按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {isDND ? (
          <BellOff className="w-5 h-5 text-gray-500" />
        ) : (
          <Bell className="w-5 h-5 text-gray-700" />
        )}
        {unreadCount > 0 && !isDND && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知面板 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">通知中心</h3>
              {isDND && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                  免打扰
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleDND}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDND ? 'bg-gray-100 text-gray-600' : 'hover:bg-gray-100 text-gray-400'
                }`}
                title={isDND ? '关闭免打扰' : '开启免打扰'}
              >
                {isDND ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                title="设置"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 设置面板 */}
          {showSettings && settings && (
            <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-4">
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">启用通知</span>
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => saveSettings({ enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">免打扰模式</span>
                  <input
                    type="checkbox"
                    checked={settings.doNotDisturb}
                    onChange={(e) => saveSettings({ doNotDisturb: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">免打扰时间:</span>
                  <input
                    type="time"
                    value={settings.doNotDisturbStart}
                    onChange={(e) => saveSettings({ doNotDisturbStart: e.target.value })}
                    className="text-sm border rounded px-2 py-1"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="time"
                    value={settings.doNotDisturbEnd}
                    onChange={(e) => saveSettings({ doNotDisturbEnd: e.target.value })}
                    className="text-sm border rounded px-2 py-1"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">各类型通知设置:</p>
                {Object.entries(settings.typeSettings).map(([type, config]) => (
                  <div key={type} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-600 capitalize">{type}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => 
                          saveSettings({
                            typeSettings: {
                              ...settings.typeSettings,
                              [type]: { ...config, enabled: e.target.checked }
                            }
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-xs text-gray-400">声音</span>
                      <input
                        type="checkbox"
                        checked={config.sound}
                        onChange={(e) => 
                          saveSettings({
                            typeSettings: {
                              ...settings.typeSettings,
                              [type]: { ...config, sound: e.target.checked }
                            }
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 过滤器 */}
          <div className="flex items-center gap-1 p-2 border-b border-gray-100 overflow-x-auto">
            {(['all', 'info', 'success', 'warning', 'error', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  filter === t
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t === 'all' ? '全部' : t}
              </button>
            ))}
          </div>

          {/* 操作栏 */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              {unreadCount > 0 ? `${unreadCount} 条未读` : '没有新通知'}
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  全部已读
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearRead}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  清空已读
                </button>
              )}
            </div>
          </div>

          {/* 通知列表 */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">加载中...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>暂无通知</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                      typeStyles[notification.type]
                    } ${!notification.read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{typeIcons[notification.type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium truncate ${
                            !notification.read ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {notification.source || '系统'}
                          </span>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-500"
                                title="标记已读"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部统计 */}
          {stats && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
              <span>总计: {stats.total}</span>
              <div className="flex items-center gap-3">
                {Object.entries(stats.byType).map(([type, count]) => 
                  count > 0 && (
                    <span key={type} className="flex items-center gap-1">
                      {typeIcons[type as NotificationType]}
                      {count}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
