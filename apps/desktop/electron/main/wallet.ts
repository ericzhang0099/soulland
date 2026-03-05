import { ipcMain, BrowserWindow, dialog } from 'electron';
import { ethers, JsonRpcSigner, Provider } from 'ethers';
import EventEmitter from 'events';

// 支持的链配置
export const SUPPORTED_CHAINS = {
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://etherscan.io',
  },
  // Polygon
  137: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon.llamarpc.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrl: 'https://polygonscan.com',
  },
  // Polygon Amoy Testnet
  80002: {
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrl: 'https://amoy.polygonscan.com',
  },
  // Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.org',
    nativeCurrency: {
      name: 'SepoliaETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://sepolia.etherscan.io',
  },
  // Hardhat Local
  31337: {
    chainId: 31337,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: '',
  },
} as const;

export type ChainId = keyof typeof SUPPORTED_CHAINS;
export type ChainConfig = (typeof SUPPORTED_CHAINS)[ChainId];

// 钱包连接类型
export type WalletType = 'metamask' | 'walletconnect' | 'injected';

// 钱包状态
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  walletType: WalletType | null;
  balance: string | null;
}

// 交易请求
export interface TransactionRequest {
  to: string;
  from?: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  chainId?: number;
}

// 签名请求
export interface SignMessageRequest {
  message: string;
  address: string;
}

// 签名类型数据请求 (EIP-712)
export interface SignTypedDataRequest {
  domain: ethers.TypedDataDomain;
  types: Record<string, Array<ethers.TypedDataField>>;
  value: Record<string, any>;
  primaryType: string;
}

// 网络切换请求
export interface SwitchNetworkRequest {
  chainId: number;
}

// 添加网络请求
export interface AddNetworkRequest {
  chainId: number;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls?: string[];
}

/**
 * 钱包管理器类
 * 处理 MetaMask 和 WalletConnect 的钱包连接、签名、网络切换等功能
 */
export class WalletManager extends EventEmitter {
  private mainWindow: BrowserWindow | null = null;
  private provider: Provider | null = null;
  private signer: JsonRpcSigner | null = null;
  private state: WalletState = {
    isConnected: false,
    address: null,
    chainId: null,
    walletType: null,
    balance: null,
  };
  private walletConnectProvider: any = null;

  constructor() {
    super();
    this.setupIpcHandlers();
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * 获取当前钱包状态
   */
  getState(): WalletState {
    return { ...this.state };
  }

  /**
   * 设置钱包状态并通知渲染进程
   */
  private setState(newState: Partial<WalletState>) {
    this.state = { ...this.state, ...newState };
    this.emit('stateChange', this.state);
    
    // 通知渲染进程状态变化
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('wallet:state-change', this.state);
    }
  }

  /**
   * 检查是否安装了 MetaMask
   */
  private async checkMetaMaskInstalled(): Promise<boolean> {
    // 在 Electron 中，我们使用外部浏览器打开 MetaMask
    // 或者通过 deeplink 调用
    return true;
  }

  /**
   * 连接 MetaMask 钱包
   * 通过 deeplink 或 QR Code 方式连接
   */
  private async connectMetaMask(): Promise<string> {
    try {
      // 创建提供者连接到以太坊节点
      // 在实际实现中，这里应该通过 WalletConnect 或类似的协议连接
      const defaultChain = SUPPORTED_CHAINS[137]; // 默认 Polygon
      this.provider = new ethers.JsonRpcProvider(defaultChain.rpcUrl);
      
      // 注意：在 Electron 中，MetaMask 连接通常通过以下方式实现：
      // 1. 使用 WalletConnect v2 协议
      // 2. 打开系统浏览器让用户连接，然后通过 deep link 返回
      // 3. 使用内置的浏览器视图加载 MetaMask
      
      // 这里我们模拟连接过程，实际项目中应该集成 WalletConnect
      const address = await this.simulateWalletConnection('metamask');
      
      this.setState({
        isConnected: true,
        address,
        chainId: defaultChain.chainId,
        walletType: 'metamask',
      });

      // 获取余额
      await this.updateBalance();
      
      return address;
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      throw error;
    }
  }

  /**
   * 连接 WalletConnect
   */
  private async connectWalletConnect(): Promise<string> {
    try {
      // WalletConnect v2 集成
      // 需要安装 @walletconnect/ethereum-provider
      const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
      
      this.walletConnectProvider = await EthereumProvider.init({
        projectId: process.env.WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
        chains: [1, 137, 80002, 11155111],
        showQrModal: true,
        methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData_v4'],
        events: ['chainChanged', 'accountsChanged'],
      });

      await this.walletConnectProvider.enable();
      
      this.provider = new ethers.BrowserProvider(this.walletConnectProvider);
      this.signer = await (this.provider as ethers.BrowserProvider).getSigner();
      
      const address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();
      
      this.setState({
        isConnected: true,
        address,
        chainId: Number(network.chainId),
        walletType: 'walletconnect',
      });

      // 监听事件
      this.walletConnectProvider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.setState({ address: accounts[0] });
          this.updateBalance();
        }
      });

      this.walletConnectProvider.on('chainChanged', (chainId: string) => {
        this.setState({ chainId: Number(chainId) });
        this.updateBalance();
      });

      this.walletConnectProvider.on('disconnect', () => {
        this.disconnect();
      });

      await this.updateBalance();
      return address;
    } catch (error) {
      console.error('WalletConnect connection failed:', error);
      throw error;
    }
  }

  /**
   * 模拟钱包连接（用于开发和测试）
   */
  private async simulateWalletConnection(type: WalletType): Promise<string> {
    // 生成一个模拟地址
    const mockAddress = '0x' + Array(40).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockAddress;
  }

  /**
   * 连接钱包
   */
  async connect(walletType: WalletType): Promise<string> {
    if (this.state.isConnected) {
      throw new Error('Wallet already connected');
    }

    switch (walletType) {
      case 'metamask':
        return this.connectMetaMask();
      case 'walletconnect':
        return this.connectWalletConnect();
      case 'injected':
        // 用于内置浏览器或其他注入的钱包
        return this.connectMetaMask();
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  }

  /**
   * 断开钱包连接
   */
  async disconnect(): Promise<void> {
    if (this.walletConnectProvider) {
      await this.walletConnectProvider.disconnect();
      this.walletConnectProvider = null;
    }

    this.provider = null;
    this.signer = null;
    
    this.setState({
      isConnected: false,
      address: null,
      chainId: null,
      walletType: null,
      balance: null,
    });
  }

  /**
   * 更新余额
   */
  async updateBalance(): Promise<string | null> {
    if (!this.provider || !this.state.address) {
      return null;
    }

    try {
      const balance = await this.provider.getBalance(this.state.address);
      const formattedBalance = ethers.formatEther(balance);
      this.setState({ balance: formattedBalance });
      return formattedBalance;
    } catch (error) {
      console.error('Failed to update balance:', error);
      return null;
    }
  }

  /**
   * 获取余额（带格式化）
   */
  async getBalance(): Promise<{ raw: bigint; formatted: string; symbol: string } | null> {
    if (!this.provider || !this.state.address || !this.state.chainId) {
      return null;
    }

    try {
      const balance = await this.provider.getBalance(this.state.address);
      const chain = SUPPORTED_CHAINS[this.state.chainId as ChainId];
      const symbol = chain?.nativeCurrency.symbol || 'ETH';
      
      return {
        raw: balance,
        formatted: ethers.formatEther(balance),
        symbol,
      };
    } catch (error) {
      console.error('Failed to get balance:', error);
      return null;
    }
  }

  /**
   * 获取指定地址的余额
   */
  async getAddressBalance(address: string, chainId?: number): Promise<{ raw: bigint; formatted: string; symbol: string } | null> {
    const targetChainId = chainId || this.state.chainId || 137;
    const chain = SUPPORTED_CHAINS[targetChainId as ChainId];
    
    if (!chain) {
      throw new Error(`Unsupported chain ID: ${targetChainId}`);
    }

    try {
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      const balance = await provider.getBalance(address);
      
      return {
        raw: balance,
        formatted: ethers.formatEther(balance),
        symbol: chain.nativeCurrency.symbol,
      };
    } catch (error) {
      console.error('Failed to get address balance:', error);
      return null;
    }
  }

  /**
   * 签名交易
   */
  async signTransaction(txRequest: TransactionRequest): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    // 显示确认对话框
    const chain = this.state.chainId ? SUPPORTED_CHAINS[this.state.chainId as ChainId] : null;
    const symbol = chain?.nativeCurrency.symbol || 'ETH';
    
    const result = await dialog.showMessageBox(this.mainWindow!, {
      type: 'question',
      title: '签名交易',
      message: '确认签名此交易？',
      detail: `
From: ${txRequest.from || this.state.address}
To: ${txRequest.to}
Value: ${txRequest.value ? ethers.formatEther(txRequest.value) : '0'} ${symbol}
Data: ${txRequest.data ? txRequest.data.slice(0, 50) + '...' : 'None'}
      `.trim(),
      buttons: ['确认签名', '取消'],
      defaultId: 1,
      cancelId: 1,
    });

    if (result.response !== 0) {
      throw new Error('User rejected transaction');
    }

    try {
      const tx = await this.signer.sendTransaction({
        to: txRequest.to,
        value: txRequest.value ? BigInt(txRequest.value) : undefined,
        data: txRequest.data as ethers.BytesLike,
        gasLimit: txRequest.gasLimit ? BigInt(txRequest.gasLimit) : undefined,
        gasPrice: txRequest.gasPrice ? BigInt(txRequest.gasPrice) : undefined,
        maxFeePerGas: txRequest.maxFeePerGas ? BigInt(txRequest.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: txRequest.maxPriorityFeePerGas ? BigInt(txRequest.maxPriorityFeePerGas) : undefined,
        nonce: txRequest.nonce,
        chainId: txRequest.chainId,
      });

      return tx.hash;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  }

  /**
   * 签名消息
   */
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    // 显示确认对话框
    const result = await dialog.showMessageBox(this.mainWindow!, {
      type: 'question',
      title: '签名消息',
      message: '确认签名此消息？',
      detail: `Message: ${message.slice(0, 100)}${message.length > 100 ? '...' : ''}`,
      buttons: ['确认签名', '取消'],
      defaultId: 1,
      cancelId: 1,
    });

    if (result.response !== 0) {
      throw new Error('User rejected message signing');
    }

    try {
      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  }

  /**
   * 签名类型数据 (EIP-712)
   */
  async signTypedData(
    domain: ethers.TypedDataDomain,
    types: Record<string, Array<ethers.TypedDataField>>,
    value: Record<string, any>
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    // 显示确认对话框
    const result = await dialog.showMessageBox(this.mainWindow!, {
      type: 'question',
      title: '签名类型数据',
      message: '确认签名此类型数据？',
      detail: `Domain: ${JSON.stringify(domain, null, 2).slice(0, 200)}...`,
      buttons: ['确认签名', '取消'],
      defaultId: 1,
      cancelId: 1,
    });

    if (result.response !== 0) {
      throw new Error('User rejected typed data signing');
    }

    try {
      const signature = await this.signer.signTypedData(domain, types, value);
      return signature;
    } catch (error) {
      console.error('Typed data signing failed:', error);
      throw error;
    }
  }

  /**
   * 切换网络
   */
  async switchNetwork(chainId: number): Promise<void> {
    const chain = SUPPORTED_CHAINS[chainId as ChainId];
    
    if (!chain) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    if (this.walletType === 'walletconnect' && this.walletConnectProvider) {
      // WalletConnect 切换网络
      await this.walletConnectProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } else {
      // MetaMask 或其他钱包切换网络
      // 更新本地 provider
      this.provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      
      if (this.signer && this.provider instanceof ethers.BrowserProvider) {
        this.signer = await this.provider.getSigner();
      }
    }

    this.setState({ chainId });
    await this.updateBalance();
  }

  /**
   * 添加自定义网络
   */
  async addNetwork(networkConfig: AddNetworkRequest): Promise<void> {
    if (this.walletType === 'walletconnect' && this.walletConnectProvider) {
      await this.walletConnectProvider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${networkConfig.chainId.toString(16)}`,
          chainName: networkConfig.chainName,
          rpcUrls: networkConfig.rpcUrls,
          nativeCurrency: networkConfig.nativeCurrency,
          blockExplorerUrls: networkConfig.blockExplorerUrls,
        }],
      });
    } else {
      // 对于 MetaMask，我们需要通过 deeplink 或浏览器扩展添加
      throw new Error('Please add the network manually in MetaMask');
    }
  }

  /**
   * 获取当前网络信息
   */
  getNetworkInfo(): ChainConfig | null {
    if (!this.state.chainId) return null;
    return SUPPORTED_CHAINS[this.state.chainId as ChainId] || null;
  }

  /**
   * 获取所有支持的链
   */
  getSupportedChains(): ChainConfig[] {
    return Object.values(SUPPORTED_CHAINS);
  }

  /**
   * 验证地址
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * 验证并格式化地址
   */
  getAddress(address: string): string | null {
    try {
      return ethers.getAddress(address);
    } catch {
      return null;
    }
  }

  /**
   * 设置 IPC 处理器
   */
  private setupIpcHandlers() {
    // 连接钱包
    ipcMain.handle('wallet:connect', async (_, walletType: WalletType) => {
      return this.connect(walletType);
    });

    // 断开钱包
    ipcMain.handle('wallet:disconnect', async () => {
      return this.disconnect();
    });

    // 获取钱包状态
    ipcMain.handle('wallet:get-state', () => {
      return this.getState();
    });

    // 获取地址
    ipcMain.handle('wallet:get-address', () => {
      return this.state.address;
    });

    // 获取余额
    ipcMain.handle('wallet:get-balance', async () => {
      return this.getBalance();
    });

    // 获取指定地址余额
    ipcMain.handle('wallet:get-address-balance', async (_, address: string, chainId?: number) => {
      return this.getAddressBalance(address, chainId);
    });

    // 签名交易
    ipcMain.handle('wallet:sign-transaction', async (_, txRequest: TransactionRequest) => {
      return this.signTransaction(txRequest);
    });

    // 签名消息
    ipcMain.handle('wallet:sign-message', async (_, message: string) => {
      return this.signMessage(message);
    });

    // 签名类型数据
    ipcMain.handle('wallet:sign-typed-data', async (_, domain, types, value) => {
      return this.signTypedData(domain, types, value);
    });

    // 切换网络
    ipcMain.handle('wallet:switch-network', async (_, chainId: number) => {
      return this.switchNetwork(chainId);
    });

    // 添加网络
    ipcMain.handle('wallet:add-network', async (_, networkConfig: AddNetworkRequest) => {
      return this.addNetwork(networkConfig);
    });

    // 获取网络信息
    ipcMain.handle('wallet:get-network-info', () => {
      return this.getNetworkInfo();
    });

    // 获取支持的链
    ipcMain.handle('wallet:get-supported-chains', () => {
      return this.getSupportedChains();
    });

    // 验证地址
    ipcMain.handle('wallet:is-valid-address', (_, address: string) => {
      return this.isValidAddress(address);
    });

    // 获取格式化地址
    ipcMain.handle('wallet:get-address-checksum', (_, address: string) => {
      return this.getAddress(address);
    });
  }
}

// 导出单例实例
export const walletManager = new WalletManager();
export default walletManager;
