# GenLoop Mobile App

基于 React Native 的跨平台移动应用

## 技术栈

- React Native 0.73+
- Expo SDK 50
- TypeScript
- React Navigation 6
- React Native Paper (UI)
- Ethers.js (Web3)
- React Query
- Zustand

## 功能特性

### 已实现 ✅
- ✅ 钱包连接（本地私钥存储）
- ✅ 基因市场浏览
- ✅ 基因详情查看
- ✅ 排行榜
- ✅ 个人中心
- ✅ 训练场
- ✅ 筛选功能
- ✅ 价格图表
- ✅ 属性展示

### 页面列表
- `HomeScreen` - 首页
- `MarketScreen` - 市场
- `GeneDetailScreen` - 基因详情
- `LeaderboardScreen` - 排行榜
- `ProfileScreen` - 个人中心
- `TrainingScreen` - 训练场
- `WalletConnectScreen` - 钱包连接

### Hooks
- `useWallet` - 钱包管理
- `useGenes` - 基因数据
- `useGene` - 单个基因
- `useLeaderboard` - 排行榜
- `useUserIdentity` - 用户身份

### 组件
- `GeneCard` - 基因卡片
- `TabBarIcon` - 底部导航图标
- `AttributeBar` - 属性条
- `PriceChart` - 价格图表
- `FilterModal` - 筛选弹窗

## 安装

```bash
cd apps/mobile
npm install
npx expo start
```

## 运行

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# 开发模式
npx expo start
```

## 构建

```bash
# iOS 生产包
eas build --platform ios

# Android 生产包
eas build --platform android

# 所有平台
eas build --platform all
```

## 项目结构

```
apps/mobile/
├── App.tsx                 # 入口
├── config.ts              # 配置文件
├── package.json           # 依赖
├── screens/               # 页面
│   ├── HomeScreen.tsx
│   ├── MarketScreen.tsx
│   ├── GeneDetailScreen.tsx
│   ├── LeaderboardScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── TrainingScreen.tsx
│   └── WalletConnectScreen.tsx
├── components/            # 组件
│   ├── GeneCard.tsx
│   ├── TabBarIcon.tsx
│   ├── AttributeBar.tsx
│   ├── PriceChart.tsx
│   └── FilterModal.tsx
└── hooks/                 # Hooks
    ├── useWallet.ts
    ├── useGenes.ts
    ├── useLeaderboard.ts
    └── useUserIdentity.ts
```

## 配置

修改 `config.ts` 中的 API 地址：

```typescript
export const API_URL = 'https://api.genloop.app';
// 或本地开发
// export const API_URL = 'http://localhost:3001';
```
