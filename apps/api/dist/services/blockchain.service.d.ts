/**
 * 区块链服务类 - 与智能合约交互
 */
declare class BlockchainService {
    private provider;
    private signer;
    private alipayContract;
    private pointsContract;
    private contractAddress;
    private pointsTokenAddress;
    constructor();
    /**
     * 初始化区块链连接
     */
    private initialize;
    /**
     * 检查服务是否可用
     */
    isAvailable(): boolean;
    /**
     * 获取合约地址
     */
    getContractAddress(): string;
    /**
     * 更新合约地址（部署后调用）
     */
    updateContractAddress(address: string): void;
    /**
     * 在链上创建订单
     */
    createOrderOnChain(userAddress: string, amountCny: number, metadata?: string): Promise<{
        orderId: string;
        transactionHash: string;
    } | null>;
    /**
     * 确认支付（由后端调用，需要 PAYMENT_OPERATOR_ROLE）
     */
    confirmPayment(orderId: string, alipayOrderNo: string): Promise<{
        transactionHash: string;
        gasUsed: bigint;
    } | null>;
    /**
     * 批量确认支付
     */
    batchConfirmPayments(orderIds: string[], alipayOrderNos: string[]): Promise<{
        transactionHash: string;
        gasUsed: bigint;
    } | null>;
    /**
     * 获取链上订单信息
     */
    getOrder(orderId: string): Promise<any | null>;
    /**
     * 获取用户链上订单列表
     */
    getUserOrders(userAddress: string): Promise<string[]>;
    /**
     * 计算可获得的积分数量
     */
    calculatePoints(amountCny: number): Promise<string>;
    /**
     * 获取汇率
     */
    getExchangeRate(): Promise<number>;
    /**
     * 检查支付宝订单号是否已使用
     */
    isAlipayOrderUsed(alipayOrderNo: string): Promise<boolean>;
    /**
     * 获取积分余额
     */
    getPointsBalance(userAddress: string): Promise<string>;
    /**
     * 初始化积分合约（获取积分合约地址后调用）
     */
    initializePointsContract(): Promise<void>;
}
declare const _default: BlockchainService;
export default _default;
//# sourceMappingURL=blockchain.service.d.ts.map