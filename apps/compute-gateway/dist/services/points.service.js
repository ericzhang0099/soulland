"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsService = void 0;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
/**
 * AGC积分服务 - 与区块链交互
 */
class PointsService {
    publicClient;
    walletClient;
    pointsContract;
    computeContract;
    // 合约ABI简化版
    pointsAbi = (0, viem_1.parseAbi)([
        'function balanceOf(address owner) view returns (uint256)',
        'function burn(address from, uint256 amount)',
        'function burnFrom(address from, uint256 amount)',
        'function decimals() view returns (uint8)',
    ]);
    constructor(rpcUrl, pointsContractAddress, computeContractAddress, privateKey) {
        this.publicClient = (0, viem_1.createPublicClient)({
            transport: (0, viem_1.http)(rpcUrl),
        });
        if (privateKey) {
            const account = (0, accounts_1.privateKeyToAccount)(privateKey);
            this.walletClient = (0, viem_1.createWalletClient)({
                account,
                transport: (0, viem_1.http)(rpcUrl),
            });
        }
        this.pointsContract = {
            address: pointsContractAddress,
            abi: this.pointsAbi,
        };
    }
    /**
     * 查询用户AGC积分余额
     */
    async getBalance(address) {
        try {
            const balance = await this.publicClient.readContract({
                ...this.pointsContract,
                functionName: 'balanceOf',
                args: [address],
            });
            return balance;
        }
        catch (error) {
            console.error('Failed to get balance:', error);
            return 0n;
        }
    }
    /**
     * 扣除用户AGC积分
     */
    async deductPoints(userAddress, amount) {
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
                args: [userAddress, amount],
            });
            // 等待确认
            await this.publicClient.waitForTransactionReceipt({ hash });
            console.log(`Deducted ${amount} points from ${userAddress}, tx: ${hash}`);
            return true;
        }
        catch (error) {
            console.error('Failed to deduct points:', error);
            return false;
        }
    }
    /**
     * 检查是否有足够积分
     */
    async hasEnoughBalance(address, requiredAmount) {
        const balance = await this.getBalance(address);
        return balance >= requiredAmount;
    }
    /**
     * 格式化积分显示 (18位小数)
     */
    formatPoints(amount) {
        const divisor = 10n ** 18n;
        const integerPart = amount / divisor;
        const fractionalPart = amount % divisor;
        return `${integerPart}.${fractionalPart.toString().padStart(18, '0').slice(0, 4)}`;
    }
    /**
     * 解析积分字符串为bigint
     */
    parsePoints(amount) {
        const [integer, fractional = ''] = amount.split('.');
        const fractionalPadded = fractional.padEnd(18, '0').slice(0, 18);
        return BigInt(integer) * 10n ** 18n + BigInt(fractionalPadded);
    }
}
exports.PointsService = PointsService;
//# sourceMappingURL=points.service.js.map