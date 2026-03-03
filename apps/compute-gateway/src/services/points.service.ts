import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * AGC积分服务 - 与区块链交互
 */
export class PointsService {
  private publicClient: any;
  private walletClient: any;
  private pointsContract: any;
  private computeContract: any;

  // 合约ABI简化版
  private pointsAbi = parseAbi([
    'function balanceOf(address owner) view returns (uint256)',
    'function burn(address from, uint256 amount)',
    'function burnFrom(address from, uint256 amount)',
    'function decimals() view returns (uint8)',
  ]);

  constructor(
    rpcUrl: string,
    pointsContractAddress: string,
    computeContractAddress: string,
    privateKey?: string
  ) {
    this.publicClient = createPublicClient({
      transport: http(rpcUrl),
    });

    if (privateKey) {
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account,
        transport: http(rpcUrl),
      });
    }

    this.pointsContract = {
      address: pointsContractAddress as `0x${string}`,
      abi: this.pointsAbi,
    };
  }

  /**
   * 查询用户AGC积分余额
   */
  async getBalance(address: string): Promise<bigint> {
    try {
      const balance = await this.publicClient.readContract({
        ...this.pointsContract,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });
      return balance as bigint;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0n;
    }
  }

  /**
   * 扣除用户AGC积分
   */
  async deductPoints(userAddress: string, amount: bigint): Promise<boolean> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized');
      }

      // 检查余额
      const balance = await this.getBalance(userAddress);
      if (balance < amount) {
        throw new Error('Insufficient balance');
      }

      // 调用burnFrom销毁积分
      const hash = await this.walletClient.writeContract({
        ...this.pointsContract,
        functionName: 'burnFrom',
        args: [userAddress as `0x${string}`, amount],
      });

      // 等待确认
      await this.publicClient.waitForTransactionReceipt({ hash });
      
      console.log(`Deducted ${amount} points from ${userAddress}, tx: ${hash}`);
      return true;
    } catch (error) {
      console.error('Failed to deduct points:', error);
      return false;
    }
  }

  /**
   * 检查是否有足够积分
   */
  async hasEnoughBalance(address: string, requiredAmount: bigint): Promise<boolean> {
    const balance = await this.getBalance(address);
    return balance >= requiredAmount;
  }

  /**
   * 格式化积分显示 (18位小数)
   */
  formatPoints(amount: bigint): string {
    const divisor = 10n ** 18n;
    const integerPart = amount / divisor;
    const fractionalPart = amount % divisor;
    return `${integerPart}.${fractionalPart.toString().padStart(18, '0').slice(0, 4)}`;
  }

  /**
   * 解析积分字符串为bigint
   */
  parsePoints(amount: string): bigint {
    const [integer, fractional = ''] = amount.split('.');
    const fractionalPadded = fractional.padEnd(18, '0').slice(0, 18);
    return BigInt(integer) * 10n ** 18n + BigInt(fractionalPadded);
  }
}
