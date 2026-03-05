# GenLoop Desktop

GenLoop 桌面应用 - AI Agent + Web3 基因进化平台

## 功能特性

- 🤖 **Agent 模式**: AI 聊天、定时任务、频道管理、Skill 市场、浏览器自动化
- 🌐 **Web3 模式**: 基因市场、NFT 交易、修仙进化、训练场、排行榜
- 🔧 **工具箱**: 一键操作、可视化配置、系统托盘、通知中心

## 下载安装

### Windows

| 版本 | 下载 | 说明 |
|------|------|------|
| 安装程序 | `GenLoop-Desktop-Setup-3.0.0-x64.exe` | 推荐，自动创建快捷方式 |
| 便携版 | `GenLoop-Desktop-Portable-3.0.0-x64.exe` | 无需安装，即开即用 |

### macOS

- `GenLoop-Desktop-3.0.0.dmg`

### Linux

- `GenLoop-Desktop-3.0.0.AppImage`

## 从源码构建

### 环境要求

- Node.js 18+
- pnpm 8+

### 安装依赖

```bash
cd apps/desktop
pnpm install
```

### 开发运行

```bash
pnpm dev
```

### 构建 Windows 安装包

```bash
# 构建安装程序
pnpm package:win

# 构建便携版
pnpm package:win:portable

# 构建所有平台
pnpm package:all
```

构建输出在 `dist-electron/` 目录：
- `GenLoop-Desktop-Setup-3.0.0-x64.exe` - 64位安装程序
- `GenLoop-Desktop-Setup-3.0.0-ia32.exe` - 32位安装程序
- `GenLoop-Desktop-Portable-3.0.0-x64.exe` - 64位便携版

## 技术栈

- Electron 28
- React 18
- TypeScript 5
- Tailwind CSS
- Zustand

## 项目结构

```
apps/desktop/
├── electron/          # Electron 主进程
│   ├── main/          # 主进程代码
│   └── preload/       # 预加载脚本
├── src/               # React 渲染进程
│   ├── components/    # UI 组件
│   ├── modes/         # Agent/Web3 模式
│   ├── stores/        # 状态管理
│   └── hooks/         # 自定义 Hooks
├── build/             # 构建资源
└── docs/              # 文档
```

## 许可证

MIT
