/**
 * AGC积分服务 - 与区块链交互
 */
export declare class PointsService {
    private publicClient;
    private walletClient;
    private pointsContract;
    private computeContract;
    private pointsAbi;
    constructor(rpcUrl: string, pointsContractAddress: string, computeContractAddress: string, privateKey?: string);
    /**
     * 查询用户AGC积分余额
     */
    getBalance(address: string): Promise<bigint>;
    /**
     * 扣除用户AGC积分
     */
    deductPoints(userAddress: string, amount: bigint): Promise<boolean>;
    /**
     * 检查是否有足够积分
     */
    hasEnoughBalance(address: string, requiredAmount: bigint): Promise<boolean>;
    /**
     * 格式化积分显示 (18位小数)
     */
    formatPoints(amount: bigint): string;
    /**
     * 解析积分字符串为bigint
     */
    parsePoints(amount: string): bigint;
}
//# sourceMappingURL=points.service.d.ts.map