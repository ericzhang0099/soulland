import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// 合约ABI - AlipayPaymentHandler
const ALIPAY_PAYMENT_HANDLER_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_pointsToken", "type": "address" },
      { "internalType": "uint256", "name": "_exchangeRate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountCny", "type": "uint256" },
      { "internalType": "string", "name": "metadata", "type": "string" }
    ],
    "name": "createOrder",
    "outputs": [{ "internalType": "bytes32", "name": "orderId", "type": "bytes32" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "orderId", "type": "bytes32" },
      { "internalType": "string", "name": "alipayOrderNo", "type": "string" }
    ],
    "name": "confirmPayment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32[]", "name": "orderIds", "type": "bytes32[]" },
      { "internalType": "string[]", "name": "alipayOrderNos", "type": "string[]" }
    ],
    "name": "batchConfirmPayments",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "orderId", "type": "bytes32" }],
    "name": "getOrder",
    "outputs": [{
      "components": [
        { "internalType": "bytes32", "name": "orderId", "type": "bytes32" },
        { "internalType": "bytes32", "name": "alipayOrderNo", "type": "bytes32" },
        { "internalType": "address", "name": "payer", "type": "address" },
        { "internalType": "uint256", "name": "amountCny", "type": "uint256" },
        { "internalType": "uint256", "name": "pointsAmount", "type": "uint256" },
        { "internalType": "uint8", "name": "status", "type": "uint8" },
        { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
        { "internalType": "uint256", "name": "paidAt", "type": "uint256" },
        { "internalType": "uint256", "name": "completedAt", "type": "uint256" },
        { "internalType": "string", "name": "metadata", "type": "string" }
      ],
      "internalType": "struct AlipayPaymentHandler.AlipayOrder",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getUserOrders",
    "outputs": [{ "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "amountCny", "type": "uint256" }],
    "name": "calculatePoints",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "exchangeRate",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minAmount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxAmount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "alipayOrderNo", "type": "string" }],
    "name": "isAlipayOrderUsed",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "orderId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "payer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amountCny", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "pointsAmount", "type": "uint256" }
    ],
    "name": "OrderCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "orderId", "type": "bytes32" },
      { "indexed": true, "internalType": "bytes32", "name": "alipayOrderNo", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256", "name": "paidAt", "type": "uint256" }
    ],
    "name": "OrderPaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "orderId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "payer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "pointsAmount", "type": "uint256" }
    ],
    "name": "OrderCompleted",
    "type": "event"
  }
];

// GenLoopPoints 合约 ABI（简化版）
const GENLOOP_POINTS_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

/**
 * 区块链服务类 - 与智能合约交互
 */
class BlockchainService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private alipayContract: ethers.Contract | null = null;
  private pointsContract: ethers.Contract | null = null;
  private contractAddress: string = '';
  private pointsTokenAddress: string = '';

  constructor() {
    this.initialize();
  }

  /**
   * 初始化区块链连接
   */
  private initialize(): void {
    try {
      const rpcUrl = process.env.RPC_URL;
      const privateKey = process.env.PRIVATE_KEY;
      this.contractAddress = process.env.ALIPAY_CONTRACT_ADDRESS || '';

      if (!rpcUrl || !privateKey) {
        console.warn('区块链配置缺失，合约功能不可用');
        return;
      }

      // 创建 provider 和 signer
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.signer = new ethers.Wallet(privateKey, this.provider);

      // 初始化合约
      if (this.contractAddress) {
        this.alipayContract = new ethers.Contract(
          this.contractAddress,
          ALIPAY_PAYMENT_HANDLER_ABI,
          this.signer
        );
      }

      console.log('区块链服务初始化成功');
    } catch (error) {
      console.error('区块链服务初始化失败:', error);
    }
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return this.provider !== null && this.signer !== null && this.alipayContract !== null;
  }

  /**
   * 获取合约地址
   */
  getContractAddress(): string {
    return this.contractAddress;
  }

  /**
   * 更新合约地址（部署后调用）
   */
  updateContractAddress(address: string): void {
    this.contractAddress = address;
    if (this.signer) {
      this.alipayContract = new ethers.Contract(
        address,
        ALIPAY_PAYMENT_HANDLER_ABI,
        this.signer
      );
    }
    console.log('合约地址已更新:', address);
  }

  /**
   * 在链上创建订单
   */
  async createOrderOnChain(
    userAddress: string,
    amountCny: number,
    metadata: string = ''
  ): Promise<{ orderId: string; transactionHash: string } | null> {
    if (!this.isAvailable()) {
      throw new Error('区块链服务不可用');
    }

    try {
      // 金额转换为分
      const amountInCents = Math.round(amountCny * 100);

      // 调用合约创建订单
      const tx = await this.alipayContract!.createOrder(amountInCents, metadata);
      const receipt = await tx.wait();

      // 从事件中获取订单ID
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.alipayContract!.interface.parseLog(log);
          return parsed?.name === 'OrderCreated';
        } catch {
          return false;
        }
      });

      let orderId = '';
      if (event) {
        const parsed = this.alipayContract!.interface.parseLog(event);
        orderId = parsed?.args.orderId;
      }

      return {
        orderId,
        transactionHash: receipt.hash,
      };
    } catch (error) {
      console.error('链上创建订单失败:', error);
      throw error;
    }
  }

  /**
   * 确认支付（由后端调用，需要 PAYMENT_OPERATOR_ROLE）
   */
  async confirmPayment(
    orderId: string,
    alipayOrderNo: string
  ): Promise<{ transactionHash: string; gasUsed: bigint } | null> {
    if (!this.isAvailable()) {
      throw new Error('区块链服务不可用');
    }

    try {
      // 将订单ID转换为 bytes32
      const orderIdBytes32 = orderId.startsWith('0x') ? orderId : ethers.keccak256(ethers.toUtf8Bytes(orderId));

      const tx = await this.alipayContract!.confirmPayment(orderIdBytes32, alipayOrderNo);
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      console.error('链上确认支付失败:', error);
      throw error;
    }
  }

  /**
   * 批量确认支付
   */
  async batchConfirmPayments(
    orderIds: string[],
    alipayOrderNos: string[]
  ): Promise<{ transactionHash: string; gasUsed: bigint } | null> {
    if (!this.isAvailable()) {
      throw new Error('区块链服务不可用');
    }

    if (orderIds.length !== alipayOrderNos.length) {
      throw new Error('订单ID和支付宝订单号数量不匹配');
    }

    try {
      const orderIdBytes32Array = orderIds.map(id => 
        id.startsWith('0x') ? id : ethers.keccak256(ethers.toUtf8Bytes(id))
      );

      const tx = await this.alipayContract!.batchConfirmPayments(orderIdBytes32Array, alipayOrderNos);
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      console.error('批量确认支付失败:', error);
      throw error;
    }
  }

  /**
   * 获取链上订单信息
   */
  async getOrder(orderId: string): Promise<any | null> {
    if (!this.isAvailable()) {
      throw new Error('区块链服务不可用');
    }

    try {
      const orderIdBytes32 = orderId.startsWith('0x') ? orderId : ethers.keccak256(ethers.toUtf8Bytes(orderId));
      const order = await this.alipayContract!.getOrder(orderIdBytes32);

      return {
        orderId: order.orderId,
        alipayOrderNo: order.alipayOrderNo,
        payer: order.payer,
        amountCny: Number(order.amountCny),
        pointsAmount: order.pointsAmount.toString(),
        status: Number(order.status),
        createdAt: Number(order.createdAt) * 1000,
        paidAt: Number(order.paidAt) * 1000,
        completedAt: Number(order.completedAt) * 1000,
        metadata: order.metadata,
      };
    } catch (error) {
      console.error('获取链上订单失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户链上订单列表
   */
  async getUserOrders(userAddress: string): Promise<string[]> {
    if (!this.isAvailable()) {
      throw new Error('区块链服务不可用');
    }

    try {
      const orders = await this.alipayContract!.getUserOrders(userAddress);
      return orders;
    } catch (error) {
      console.error('获取用户链上订单失败:', error);
      throw error;
    }
  }

  /**
   * 计算可获得的积分数量
   */
  async calculatePoints(amountCny: number): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('区块链服务不可用');
    }

    try {
      const amountInCents = Math.round(amountCny * 100);
      const points = await this.alipayContract!.calculatePoints(amountInCents);
      return points.toString();
    } catch (error) {
      console.error('计算积分失败:', error);
      throw error;
    }
  }

  /**
   * 获取汇率
   */
  async getExchangeRate(): Promise<number> {
    if (!this.isAvailable()) {
      throw new Error('区块链服务不可用');
    }

    try {
      const rate = await this.alipayContract!.exchangeRate();
      return Number(rate);
    } catch (error) {
      console.error('获取汇率失败:', error);
      throw error;
    }
  }

  /**
   * 检查支付宝订单号是否已使用
   */
  async isAlipayOrderUsed(alipayOrderNo: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('区块链服务不可用');
    }

    try {
      return await this.alipayContract!.isAlipayOrderUsed(alipayOrderNo);
    } catch (error) {
      console.error('检查支付宝订单号失败:', error);
      throw error;
    }
  }

  /**
   * 获取积分余额
   */
  async getPointsBalance(userAddress: string): Promise<string> {
    if (!this.pointsContract || !this.provider) {
      throw new Error('积分合约未初始化');
    }

    try {
      const balance = await this.pointsContract.balanceOf(userAddress);
      return balance.toString();
    } catch (error) {
      console.error('获取积分余额失败:', error);
      throw error;
    }
  }

  /**
   * 初始化积分合约（获取积分合约地址后调用）
   */
  async initializePointsContract(): Promise<void> {
    if (!this.alipayContract || !this.signer) {
      throw new Error('支付宝合约未初始化');
    }

    try {
      this.pointsTokenAddress = await this.alipayContract.pointsToken();
      this.pointsContract = new ethers.Contract(
        this.pointsTokenAddress,
        GENLOOP_POINTS_ABI,
        this.signer
      );
      console.log('积分合约初始化成功:', this.pointsTokenAddress);
    } catch (error) {
      console.error('初始化积分合约失败:', error);
      throw error;
    }
  }
}

export default new BlockchainService();
