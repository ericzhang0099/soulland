# GenLoop Desktop 3.0 设计文档

**版本**: v1.0  
**日期**: 2026-03-05  
**状态**: 设计确认，待开发

---

## 1. 产品概述

### 1.1 产品定位
GenLoop Desktop 是 GenLoop 3.0 的桌面端应用，采用**双模式架构**：
- **🤖 Agent 模式**: 类似 ClawX 的 AI 管理界面（原生实现）
- **🌐 Web3 模式**: 嵌入 GenLoop Web 的 WebView（快速集成）

### 1.2 核心价值
| 痛点 | 解决方案 |
|------|---------|
| 命令行操作复杂 | GUI 一键操作 |
| OpenClaw 联网困难 | 内置代理/镜像 |
| 多工具切换繁琐 | 统一界面集成 |
| 浏览器插件依赖 | 内置浏览器自动化 |
| 配置 YAML 难懂 | 可视化配置界面 |

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    GenLoop Desktop                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Electron Main Process                    │  │
│  │  • 窗口管理 (BrowserWindow)                           │  │
│  │  • Gateway 进程管理                                   │  │
│  │  • 区块链节点管理 (可选)                               │  │
│  │  • 系统托盘/通知                                       │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │ IPC (electron.contextBridge)   │
│                             ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React Renderer Process                   │  │
│  │                                                       │  │
│  │  ┌─────────────────┐    ┌─────────────────────────┐   │  │
│  │  │   Agent 模式    │    │      Web3 模式          │   │  │
│  │  │  ┌───────────┐  │    │  ┌─────────────────┐    │   │  │
│  │  │  │ Chat UI   │  │◄──►│  │  WebView        │    │   │  │
│  │  │  │ Cron      │  │    │  │  (genloop.app)  │    │   │  │
│  │  │  │ Channels  │  │    │  └─────────────────┘    │   │  │
│  │  │  │ Skills    │  │    │                         │   │  │
│  │  │  │ Browser   │  │    │  钱包桥接 (原生)        │   │  │
│  │  │  └───────────┘  │    │  通知转发 (原生)        │   │  │
│  │  └─────────────────┘    └─────────────────────────┘   │  │
│  │                                                       │  │
│  │  ┌───────────────────────────────────────────────┐    │  │
│  │  │  统一组件: Sidebar / WalletBar / StatusBar    │    │  │
│  │  └───────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ WebSocket / HTTP
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ OpenClaw    │  │ GenLoop API │  │ 区块链网络          │  │
│  │ Gateway     │  │ (Node.js)   │  │ - Polygon           │  │
│  │             │  │             │  │ - Ethereum          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Electron | ^28.0 |
| UI | React | ^18.2 |
| 语言 | TypeScript | ^5.3 |
| 样式 | Tailwind CSS | ^3.4 |
| 组件库 | shadcn/ui | latest |
| 状态管理 | Zustand | ^4.4 |
| 路由 | React Router | ^6.20 |
| 构建 | Vite | ^5.0 |
| 打包 | electron-builder | ^24.0 |
| 自动化 | Puppeteer | ^21.0 |

---

## 3. 功能模块详解

### 3.1 🤖 Agent 模式

#### 3.1.1 AI 聊天界面
```typescript
// 核心功能
interface ChatPanel {
  // 多会话管理
  conversations: Conversation[];
  
  // 消息类型支持
  messageTypes: ['text', 'image', 'code', 'markdown'];
  
  // 快捷命令
  quickCommands: [
    '/gene',      // 查询基因信息
    '/market',    // 查看市场行情
    '/train',     // 开始训练
    '/schedule',  // 创建定时任务
  ];
  
  // 上下文记忆
  contextMemory: boolean;
}
```

**实现逻辑**:
1. 通过 WebSocket 连接 OpenClaw Gateway
2. 发送用户消息到 Gateway
3. 接收 AI 响应并渲染
4. 支持 Markdown 和代码高亮

#### 3.1.2 定时任务调度器 (Cron)
```typescript
interface CronScheduler {
  // 任务列表
  jobs: CronJob[];
  
  // 可视化编辑器
  editor: {
    type: 'visual' | 'code';  // 可视化或 Cron 表达式
    presets: string[];        // 预设: 每小时/每天/每周
  };
  
  // 执行记录
  history: ExecutionLog[];
  
  // 通知设置
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    channels: string[];  // 通知渠道
  };
}

interface CronJob {
  id: string;
  name: string;
  schedule: string;      // Cron 表达式
  agentId: string;       // 执行的 Agent
  prompt: string;        // 发送给 Agent 的提示
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}
```

**实现逻辑**:
1. 使用 node-cron 库在 Main Process 执行
2. 渲染进程通过 IPC 创建/编辑/删除任务
3. 任务触发时调用 Gateway API
4. 执行结果保存到本地存储

#### 3.1.3 频道管理
```typescript
interface ChannelManager {
  channels: Channel[];
  
  // 支持的频道类型
  supportedTypes: ['telegram', 'discord', 'slack', 'email'];
  
  // 消息模板
  templates: MessageTemplate[];
}

interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  config: ChannelConfig;
  webhook?: string;
}
```

**实现逻辑**:
1. 配置存储在本地加密数据库
2. 通过 Gateway 的 channel 插件连接
3. 支持测试连接功能
4. 消息发送通过 Gateway API

#### 3.1.4 Skill 市场
```typescript
interface SkillMarketplace {
  // 技能列表
  skills: Skill[];
  
  // 分类
  categories: ['web3', 'automation', 'data', 'notification'];
  
  // 操作
  actions: {
    install: (skillId: string) => Promise<void>;
    uninstall: (skillId: string) => Promise<void>;
    update: (skillId: string) => Promise<void>;
    configure: (skillId: string, config: any) => Promise<void>;
  };
}

interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  downloads: number;
  rating: number;
  installed: boolean;
  hasUpdate: boolean;
}
```

**实现逻辑**:
1. 从远程仓库获取技能列表
2. 调用 Gateway 的 skill install 命令
3. 安装进度实时显示
4. 配置界面动态生成

#### 3.1.5 浏览器自动化
```typescript
interface BrowserAutomation {
  // 浏览器选择
  browser: 'builtin' | 'chrome';
  
  // 内置浏览器 (Puppeteer)
  builtin: {
    chromiumPath: string;
    launchOptions: PuppeteerLaunchOptions;
  };
  
  // Chrome 扩展
  chromeExtension: {
    installed: boolean;
    extensionId: string;
  };
  
  // 脚本管理
  scripts: AutomationScript[];
  
  // 录制功能
  recorder: {
    isRecording: boolean;
    recordedActions: Action[];
  };
}

interface AutomationScript {
  id: string;
  name: string;
  steps: AutomationStep[];
  schedule?: string;  // 可选定时执行
  lastRun?: Date;
}

type AutomationStep = 
  | { type: 'navigate'; url: string }
  | { type: 'click'; selector: string }
  | { type: 'type'; selector: string; text: string }
  | { type: 'wait'; duration: number }
  | { type: 'screenshot'; fullPage?: boolean }
  | { type: 'evaluate'; script: string };
```

**实现逻辑 - 内置浏览器**:
```typescript
// electron/main/browser-manager.ts
import puppeteer from 'puppeteer-core';

class BrowserManager {
  private browser: Browser | null = null;
  
  async launchBuiltin() {
    const chromiumPath = await this.downloadChromium();
    this.browser = await puppeteer.launch({
      headless: false,
      executablePath: chromiumPath,
      userDataDir: path.join(app.getPath('userData'), 'chromium'),
    });
    return this.browser;
  }
  
  async executeScript(script: AutomationScript) {
    const page = await this.browser.newPage();
    
    for (const step of script.steps) {
      switch (step.type) {
        case 'navigate':
          await page.goto(step.url);
          break;
        case 'click':
          await page.click(step.selector);
          break;
        case 'type':
          await page.type(step.selector, step.text);
          break;
        case 'screenshot':
          await page.screenshot({ 
            path: this.getScreenshotPath(),
            fullPage: step.fullPage 
          });
          break;
      }
    }
  }
}
```

**实现逻辑 - Chrome 扩展**:
```javascript
// chrome-extension/background.js
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    switch (request.action) {
      case 'openTab':
        chrome.tabs.create({ url: request.url }, (tab) => {
          sendResponse({ tabId: tab.id });
        });
        return true; // 异步响应
        
      case 'executeScript':
        chrome.tabs.executeScript(request.tabId, {
          code: request.script
        }, (results) => {
          sendResponse({ results });
        });
        return true;
        
      case 'screenshot':
        chrome.tabs.captureVisibleTab(null, {}, (dataUrl) => {
          sendResponse({ screenshot: dataUrl });
        });
        return true;
    }
  }
);
```

---

### 3.2 🌐 Web3 模式

#### 3.2.1 WebView 嵌入
```typescript
interface Web3Mode {
  // WebView 配置
  webview: {
    src: 'https://genloop.app';
    partition: 'persist:genloop';
    preload: string;  // 预加载脚本
  };
  
  // 与 WebView 通信
  bridge: {
    // 从 WebView 接收
    onMessage: (event: MessageEvent) => void;
    // 向 WebView 发送
    postMessage: (data: any) => void;
  };
}
```

**实现逻辑**:
```typescript
// src/modes/web3/Web3Mode.tsx
import { useRef, useEffect } from 'react';

export function Web3Mode() {
  const webviewRef = useRef<WebviewTag>(null);
  
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;
    
    // 加载完成
    webview.addEventListener('dom-ready', () => {
      // 注入桥接脚本
      webview.executeJavaScript(`
        window.genloopDesktop = {
          postMessage: (data) => {
            window.postMessage({ source: 'genloop-web', ...data }, '*');
          }
        };
      `);
    });
    
    // 接收消息
    webview.addEventListener('ipc-message', (event) => {
      if (event.channel === 'wallet-request') {
        // 转发到桌面端钱包
        handleWalletRequest(event.args[0]);
      }
    });
  }, []);
  
  return (
    <webview
      ref={webviewRef}
      src="https://genloop.app"
      partition="persist:genloop"
      allowpopups
      style={{ width: '100%', height: '100%' }}
    />
  );
}
```

#### 3.2.2 钱包桥接
```typescript
// 桥接 WebView 中的钱包请求到桌面端
interface WalletBridge {
  // WebView 请求签名
  async signTransaction(tx: Transaction): Promise<Signature>;
  
  // WebView 请求连接钱包
  async connect(): Promise<string>;  // 返回地址
  
  // WebView 请求断开
  async disconnect(): Promise<void>;
  
  // 获取当前账户
  async getAccount(): Promise<Account | null>;
}
```

**实现逻辑**:
```typescript
// electron/main/wallet-bridge.ts
ipcMain.handle('wallet:sign-transaction', async (event, tx) => {
  // 显示确认对话框
  const result = await dialog.showMessageBox({
    type: 'question',
    title: '签名交易',
    message: `确认签名交易?`,
    detail: `From: ${tx.from}\nTo: ${tx.to}\nValue: ${tx.value}`,
    buttons: ['确认', '取消'],
  });
  
  if (result.response === 0) {
    // 调用本地钱包签名
    return await wallet.signTransaction(tx);
  }
  
  throw new Error('User rejected');
});
```

---

### 3.3 🔧 工具箱

#### 3.3.1 一键操作
```typescript
interface QuickActions {
  // Gateway 管理
  gateway: {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    restart: () => Promise<void>;
    status: () => GatewayStatus;
  };
  
  // Skill 管理
  skills: {
    install: (skillId: string) => Promise<void>;
    updateAll: () => Promise<void>;
  };
  
  // 系统
  system: {
    clearCache: () => Promise<void>;
    exportLogs: () => Promise<string>;
    resetConfig: () => Promise<void>;
  };
}
```

#### 3.3.2 可视化配置
```typescript
interface ConfigEditor {
  // 配置项
  sections: ConfigSection[];
  
  // 编辑模式
  mode: 'visual' | 'json';
  
  // 验证
  validation: {
    realtime: boolean;
    errors: ValidationError[];
  };
  
  // 导入/导出
  importExport: {
    import: (file: File) => Promise<void>;
    export: () => Promise<Blob>;
  };
}

interface ConfigSection {
  id: string;
  title: string;
  icon: string;
  fields: ConfigField[];
}

type ConfigField = 
  | { type: 'text'; key: string; label: string; value: string }
  | { type: 'number'; key: string; label: string; value: number; min?: number; max?: number }
  | { type: 'select'; key: string; label: string; value: string; options: string[] }
  | { type: 'toggle'; key: string; label: string; value: boolean }
  | { type: 'array'; key: string; label: string; value: string[] };
```

---

## 4. 状态管理 (Zustand)

### 4.1 Store 结构
```typescript
// src/stores/index.ts
import { create } from 'zustand';

interface AppState {
  // 当前模式
  mode: 'agent' | 'web3';
  setMode: (mode: 'agent' | 'web3') => void;
  
  // 钱包状态
  wallet: WalletState;
  
  // Gateway 状态
  gateway: GatewayState;
  
  // Agent 状态
  agent: AgentState;
  
  // Web3 状态
  web3: Web3State;
}

const useAppStore = create<AppState>((set, get) => ({
  mode: 'agent',
  setMode: (mode) => set({ mode }),
  
  wallet: {
    address: null,
    isConnected: false,
    connect: async () => { /* ... */ },
    disconnect: async () => { /* ... */ },
  },
  
  gateway: {
    status: 'stopped',
    start: async () => { /* ... */ },
    stop: async () => { /* ... */ },
  },
  
  // ...
}));
```

---

## 5. IPC 通信协议

### 5.1 Main → Renderer
```typescript
// 预加载脚本暴露的 API
interface ElectronAPI {
  // Gateway 管理
  gateway: {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    getStatus: () => Promise<GatewayStatus>;
    onStatusChange: (callback: (status: GatewayStatus) => void) => void;
  };
  
  // 钱包
  wallet: {
    connect: () => Promise<string>;
    signTransaction: (tx: Transaction) => Promise<Signature>;
  };
  
  // 浏览器
  browser: {
    launch: (type: 'builtin' | 'chrome') => Promise<void>;
    executeScript: (script: AutomationScript) => Promise<any>;
  };
  
  // 系统
  system: {
    getPlatform: () => 'win32' | 'darwin' | 'linux';
    getVersion: () => string;
    openExternal: (url: string) => Promise<void>;
  };
}
```

---

## 6. 开发计划

### 6.1 里程碑

| 阶段 | 时间 | 交付物 |
|------|------|--------|
| **M1** | Week 1 | Electron 框架 + 基础 UI |
| **M2** | Week 2 | Agent 模式 (聊天 + Cron) |
| **M3** | Week 3 | WebView 嵌入 + 钱包桥接 |
| **M4** | Week 4 | 浏览器自动化 + 工具箱 |
| **M5** | Week 5 | 测试优化 + 打包发布 |

### 6.2 文件结构
```
genloop-desktop/
├── electron/
│   ├── main/
│   │   ├── index.ts           # 入口
│   │   ├── window.ts          # 窗口管理
│   │   ├── gateway.ts         # Gateway 管理
│   │   ├── wallet.ts          # 钱包集成
│   │   ├── browser.ts         # 浏览器自动化
│   │   └── ipc-handlers.ts    # IPC 处理
│   ├── preload/
│   │   └── index.ts           # 预加载脚本
│   └── utils/
│       ├── paths.ts
│       └── storage.ts
├── src/
│   ├── main.tsx               # React 入口
│   ├── App.tsx                # 根组件
│   ├── modes/
│   │   ├── agent/
│   │   │   ├── AgentMode.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── CronScheduler.tsx
│   │   │   ├── ChannelManager.tsx
│   │   │   ├── SkillMarket.tsx
│   │   │   └── BrowserAutomation.tsx
│   │   └── web3/
│   │       └── Web3Mode.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── WalletBar.tsx
│   │   ├── StatusBar.tsx
│   │   └── ModeSwitcher.tsx
│   ├── stores/
│   │   ├── appStore.ts
│   │   ├── walletStore.ts
│   │   ├── gatewayStore.ts
│   │   └── agentStore.ts
│   ├── hooks/
│   │   ├── useGateway.ts
│   │   ├── useWallet.ts
│   │   └── useBrowser.ts
│   └── lib/
│       ├── api.ts
│       ├── websocket.ts
│       └── utils.ts
├── package.json
├── vite.config.ts
├── electron-builder.yml
└── tsconfig.json
```

---

## 7. 打包发布

### 7.1 构建命令
```bash
# 开发
pnpm dev

# 构建
pnpm build

# 打包
pnpm package:win    # Windows
pnpm package:mac    # macOS
pnpm package:linux  # Linux

# 全部
pnpm package:all
```

### 7.2 自动更新
```typescript
// electron/main/updater.ts
import { autoUpdater } from 'electron-updater';

export function setupUpdater() {
  autoUpdater.checkForUpdatesAndNotify();
  
  autoUpdater.on('update-available', () => {
    // 显示更新提示
  });
  
  autoUpdater.on('update-downloaded', () => {
    // 提示重启安装
    autoUpdater.quitAndInstall();
  });
}
```

---

## 8. 安全考虑

| 方面 | 措施 |
|------|------|
| **API Key 存储** | 系统 keychain / Windows Credential |
| **IPC 安全** | Context Isolation + 预加载脚本 |
| **WebView 隔离** | 独立 partition，防止 Cookie 泄露 |
| **代码签名** | 发布时签名验证 |
| **自动更新** | 签名验证后安装 |

---

## 9. 总结

**GenLoop Desktop =**
- 🤖 **Agent 模式**: ClawX 风格的 AI 管理 (原生)
- 🌐 **Web3 模式**: WebView 嵌入 GenLoop Web (快速)
- 🔧 **工具箱**: 一键操作 + 可视化配置
- 🌐 **浏览器自动化**: Puppeteer + Chrome 扩展

**核心优势**: 零命令行、一键操作、开箱即用、网络无忧

---

**文档版本**: v1.0  
**编写日期**: 2026-03-05  
**状态**: 待开发确认
