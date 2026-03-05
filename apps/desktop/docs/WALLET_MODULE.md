# GenLoop Desktop 钱包集成模块

## 概述

钱包集成模块为 GenLoop Desktop 提供了完整的 Web3 钱包功能，支持 MetaMask 和 WalletConnect 两种连接方式。

## 功能特性

### 1. 钱包连接
- **MetaMask**: 通过 deeplink 或浏览器扩展连接
- **WalletConnect**: 支持 WalletConnect v2 协议，通过 QR Code 扫描连接
- **自动重连**: 应用启动时自动恢复之前的连接状态

### 2. 交易签名
- 普通交易签名 (`eth_sendTransaction`)
- 消息签名 (`personal_sign`)
- 类型数据签名 EIP-712 (`eth_signTypedData_v4`)
- 签名前显示确认对话框

### 3. 余额查询
- 查询当前连接钱包的余额
- 查询任意地址的余额
- 支持多链余额查询

### 4. 网络切换
- 一键切换支持的区块链网络
- 支持的网络:
  - Ethereum Mainnet (Chain ID: 1)
  - Polygon Mainnet (Chain ID: 137)
  - Polygon Amoy Testnet (Chain ID: 80002)
  - Sepolia Testnet (Chain ID: 11155111)
  - Hardhat Local (Chain ID: 31337)

## 文件结构

```
apps/desktop/
├── electron/
│   ├── main/
│   │   ├── index.ts          # 主进程入口，初始化钱包管理器
│   │   └── wallet.ts         # 钱包管理器实现
│   └── preload/
│       └── index.ts          # 预加载脚本，暴露钱包 API
├── src/
│   ├── components/
│   │   ├── WalletBar.tsx     # 钱包连接 UI 组件
│   │   └── ui/               # UI 组件库
│   ├── hooks/
│   │   └── useWallet.ts      # React Hook for 钱包操作
│   ├── stores/
│   │   └── walletStore.ts    # Zustand 状态管理
│   └── types/
│       └── global.d.ts       # 全局类型声明
```

## 使用方法

### 在 React 组件中使用

```tsx
import { useWalletStore } from '../stores/walletStore';

function MyComponent() {
  const { 
    isConnected, 
    address, 
    balance, 
    connect, 
    disconnect,
    signTransaction 
  } = useWalletStore();

  const handleConnect = async () => {
    try {
      await connect('metamask');
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleSendTransaction = async () => {
    try {
      const txHash = await signTransaction({
        to: '0x...',
        value: '1000000000000000000', // 1 ETH in wei
      });
      console.log('Transaction hash:', txHash);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      {isConnected ? (
        <>
          <p>Address: {address}</p>
          <p>Balance: {balance}</p>
          <button onClick={handleSendTransaction}>Send Transaction</button>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### 使用 Hook

```tsx
import { useWallet } from '../hooks/useWallet';

function MyComponent() {
  const { 
    isConnected, 
    address, 
    connect, 
    signMessage,
    formatAddress 
  } = useWallet();

  return (
    <div>
      <p>{formatAddress(address)}</p>
    </div>
  );
}
```

## API 参考

### WalletManager (Main Process)

```typescript
class WalletManager {
  // 连接钱包
  async connect(walletType: WalletType): Promise<string>;
  
  // 断开连接
  async disconnect(): Promise<void>;
  
  // 获取余额
  async getBalance(): Promise<BalanceInfo | null>;
  async getAddressBalance(address: string, chainId?: number): Promise<BalanceInfo | null>;
  
  // 签名
  async signTransaction(txRequest: TransactionRequest): Promise<string>;
  async signMessage(message: string): Promise<string>;
  async signTypedData(domain, types, value): Promise<string>;
  
  // 网络
  async switchNetwork(chainId: number): Promise<void>;
  async addNetwork(networkConfig: AddNetworkRequest): Promise<void>;
  getNetworkInfo(): ChainConfig | null;
  getSupportedChains(): ChainConfig[];
  
  // 工具
  isValidAddress(address: string): boolean;
  getAddress(address: string): string | null;
}
```

### IPC 通道

| 通道 | 方向 | 参数 | 返回值 |
|------|------|------|--------|
| `wallet:connect` | invoke | walletType | string (address) |
| `wallet:disconnect` | invoke | - | void |
| `wallet:get-state` | invoke | - | WalletState |
| `wallet:get-balance` | invoke | - | BalanceInfo |
| `wallet:sign-transaction` | invoke | TransactionRequest | string (txHash) |
| `wallet:sign-message` | invoke | message | string (signature) |
| `wallet:switch-network` | invoke | chainId | void |
| `wallet:get-supported-chains` | invoke | - | ChainConfig[] |
| `wallet:state-change` | on | - | WalletState |

## 配置

### 环境变量

```bash
# WalletConnect Project ID (从 https://cloud.walletconnect.com 获取)
WALLETCONNECT_PROJECT_ID=your_project_id
```

### 添加自定义网络

在 `electron/main/wallet.ts` 中的 `SUPPORTED_CHAINS` 对象中添加新的网络配置：

```typescript
export const SUPPORTED_CHAINS = {
  // ... 现有网络
  
  // 自定义网络
  12345: {
    chainId: 12345,
    name: 'My Custom Network',
    rpcUrl: 'https://my-network.rpc.com',
    nativeCurrency: {
      name: 'MyToken',
      symbol: 'MTK',
      decimals: 18,
    },
    blockExplorerUrl: 'https://explorer.my-network.com',
  },
};
```

## 安全注意事项

1. **签名确认**: 所有签名操作都会显示确认对话框，用户必须手动确认
2. **私钥安全**: 私钥永远不会离开钱包应用，只在钱包内部使用
3. **网络验证**: 切换网络时会验证网络配置的有效性
4. **地址校验**: 所有地址输入都会进行校验和格式化

## 依赖

- `ethers`: ^6.10.0 - Ethereum 库
- `@walletconnect/ethereum-provider`: ^2.11.0 - WalletConnect v2 支持

## 待办事项

- [ ] 实现 MetaMask deeplink 连接
- [ ] 添加硬件钱包支持 (Ledger, Trezor)
- [ ] 实现多钱包同时连接
- [ ] 添加交易历史记录
- [ ] 实现代币余额查询 (ERC-20)
- [ ] 添加 NFT 支持 (ERC-721, ERC-1155)
