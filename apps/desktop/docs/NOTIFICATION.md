# GenLoop Desktop 通知中心

## 概述

通知中心模块为 GenLoop Desktop 提供了完整的本地通知管理功能，包括：

1. **通知管理器** - 核心管理类，处理通知的创建、存储和分发
2. **本地通知** - 使用 Electron 原生 Notification API 发送系统级通知
3. **通知历史记录** - 持久化存储通知历史，支持查询和统计
4. **通知设置** - 可配置的通知行为，包括免打扰模式、类型开关等

## 文件结构

```
electron/main/
├── notification.ts          # 主进程通知管理器
├── index.ts                 # 集成通知管理器到主进程
└── preload/index.ts         # 添加通知 API 到 preload

src/
├── hooks/
│   └── useNotification.ts   # React Hook 用于前端
└── components/
    └── NotificationCenter.tsx # 通知中心 UI 组件
```

## 功能特性

### 1. 通知类型

- `info` - 信息通知
- `success` - 成功通知
- `warning` - 警告通知
- `error` - 错误通知
- `system` - 系统通知

### 2. 通知优先级

- `low` - 低优先级
- `normal` - 普通优先级
- `high` - 高优先级
- `critical` - 紧急优先级（免打扰模式下仍会显示）

### 3. 设置选项

- **全局开关** - 启用/禁用所有通知
- **免打扰模式** - 在指定时间段内静默非紧急通知
- **类型设置** - 为每种通知类型单独配置启用状态和声音
- **应用设置** - 按来源应用过滤通知
- **历史记录** - 配置最大保留数量和自动清理策略

## 使用方法

### 在主进程中发送通知

```typescript
import { notificationManager } from './notification.js';

// 发送信息通知
await notificationManager.info('标题', '通知内容');

// 发送成功通知
await notificationManager.success('操作成功', '数据已保存');

// 发送警告通知
await notificationManager.warning('注意', '存储空间不足', {
  priority: 'high'
});

// 发送错误通知
await notificationManager.error('连接失败', '无法连接到服务器', {
  priority: 'high',
  source: 'gateway'
});

// 发送系统通知
await notificationManager.system('系统更新', '新版本可用');

// 使用通用方法发送
await notificationManager.notify({
  title: '自定义通知',
  body: '通知内容',
  type: 'info',
  priority: 'normal',
  source: 'my-module',
  data: { customField: 'value' }
});
```

### 在渲染进程中使用

```typescript
import { useNotification } from '../hooks/useNotification';

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    sendNotification,
    markAsRead,
    markAllAsRead 
  } = useNotification();

  // 发送通知
  const handleNotify = async () => {
    await sendNotification({
      title: 'Hello',
      body: 'World',
      type: 'info'
    });
  };

  return (
    <div>
      <p>未读通知: {unreadCount}</p>
      <button onClick={handleNotify}>发送通知</button>
    </div>
  );
}
```

### 使用通知中心组件

```typescript
import { NotificationCenter } from '../components/NotificationCenter';

function Header() {
  return (
    <header>
      <NotificationCenter />
    </header>
  );
}
```

## API 参考

### NotificationManager (主进程)

#### 方法

| 方法 | 描述 |
|------|------|
| `notify(options)` | 发送通知 |
| `info(title, body, options?)` | 发送信息通知 |
| `success(title, body, options?)` | 发送成功通知 |
| `warning(title, body, options?)` | 发送警告通知 |
| `error(title, body, options?)` | 发送错误通知 |
| `system(title, body, options?)` | 发送系统通知 |
| `getNotifications(options?)` | 获取通知列表 |
| `getNotification(id)` | 获取单个通知 |
| `markAsRead(id)` | 标记为已读 |
| `markAllAsRead()` | 标记所有为已读 |
| `deleteNotification(id)` | 删除通知 |
| `clearAll()` | 清空所有通知 |
| `clearRead()` | 清空已读通知 |
| `getStats()` | 获取统计信息 |
| `getSettings()` | 获取设置 |
| `saveSettings(settings)` | 保存设置 |
| `resetSettings()` | 重置设置为默认值 |
| `toggleDND()` | 切换免打扰模式 |

#### 事件

| 事件 | 描述 |
|------|------|
| `notification` | 新通知创建时触发 |
| `notificationClicked` | 通知被点击时触发 |
| `notificationRead` | 通知被标记为已读时触发 |
| `allNotificationsRead` | 所有通知被标记为已读时触发 |
| `notificationDeleted` | 通知被删除时触发 |
| `notificationsCleared` | 所有通知被清空时触发 |
| `settingsChange` | 设置变更时触发 |

### useNotification Hook (渲染进程)

#### 返回值

| 属性/方法 | 类型 | 描述 |
|-----------|------|------|
| `notifications` | `Notification[]` | 通知列表 |
| `unreadCount` | `number` | 未读数量 |
| `stats` | `NotificationStats \| null` | 统计信息 |
| `settings` | `NotificationSettings \| null` | 当前设置 |
| `isLoading` | `boolean` | 加载状态 |
| `isDND` | `boolean` | 免打扰状态 |
| `sendNotification` | `(options) => Promise<Notification>` | 发送通知 |
| `markAsRead` | `(id) => Promise<boolean>` | 标记已读 |
| `markAllAsRead` | `() => Promise<number>` | 标记所有已读 |
| `deleteNotification` | `(id) => Promise<boolean>` | 删除通知 |
| `clearAll` | `() => Promise<number>` | 清空所有 |
| `clearRead` | `() => Promise<number>` | 清空已读 |
| `saveSettings` | `(settings) => Promise<NotificationSettings>` | 保存设置 |
| `resetSettings` | `() => Promise<NotificationSettings>` | 重置设置 |
| `toggleDND` | `() => Promise<boolean>` | 切换免打扰 |

## 集成示例

### 在 Gateway 管理器中集成

已在 `gateway.ts` 中集成通知：

```typescript
// 启动成功时
notificationManager.success('Gateway 已启动', `Gateway 服务正在运行在端口 ${port}`);

// 启动失败时
notificationManager.error('Gateway 启动失败', error.message, { priority: 'high' });

// 异常退出时
notificationManager.error('Gateway 异常退出', `进程退出码: ${code}`, { priority: 'high' });

// 停止时
notificationManager.info('Gateway 已停止', 'Gateway 服务已停止运行');
```

## 数据存储

通知设置和历史记录存储在用户数据目录：

- **设置**: `~/.config/genloop-desktop/notification-settings.json`
- **历史**: `~/.config/genloop-desktop/notification-history.json`

## 注意事项

1. 系统通知需要操作系统支持，在某些 Linux 发行版上可能需要额外配置
2. macOS 上会自动更新 Dock 角标显示未读数量
3. 免打扰模式下，只有 `critical` 优先级的通知会显示
4. 历史记录会自动清理超过指定天数的已读通知
