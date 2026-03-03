export declare enum AGCTransactionType {
    PURCHASE = "purchase",
    SPEND = "spend",
    REFUND = "refund",
    REWARD = "reward",
    TRANSFER_IN = "transfer_in",
    TRANSFER_OUT = "transfer_out"
}
export interface AGCBalance {
    id: number;
    user_address: string;
    balance: number;
    total_earned: number;
    total_spent: number;
    last_updated: Date;
    created_at: Date;
}
export interface AGCTransaction {
    id: number;
    user_address: string;
    transaction_type: AGCTransactionType;
    amount: number;
    order_id: string | null;
    transaction_hash: string | null;
    description: string | null;
    created_at: Date;
}
/**
 * AGC积分余额模型类
 */
export declare class AGCBalanceModel {
    /**
     * 获取或创建用户余额记录
     */
    static getOrCreate(userAddress: string): Promise<AGCBalance>;
    /**
     * 获取用户余额
     */
    static getBalance(userAddress: string): Promise<number>;
    /**
     * 增加用户余额（购买、奖励等）
     */
    static addBalance(userAddress: string, amount: number, transactionType: AGCTransactionType, data?: {
        order_id?: string;
        transaction_hash?: string;
        description?: string;
    }): Promise<boolean>;
    /**
     * 减少用户余额（消费等）
     */
    static subtractBalance(userAddress: string, amount: number, transactionType: AGCTransactionType, data?: {
        order_id?: string;
        transaction_hash?: string;
        description?: string;
    }): Promise<boolean>;
    /**
     * 退款（恢复余额）
     */
    static refund(userAddress: string, amount: number, orderId: string, transactionHash?: string): Promise<boolean>;
    /**
     * 获取用户交易记录
     */
    static getTransactions(userAddress: string, options?: {
        limit?: number;
        offset?: number;
        type?: AGCTransactionType;
    }): Promise<AGCTransaction[]>;
    /**
     * 获取用户统计信息
     */
    static getUserStats(userAddress: string): Promise<{
        balance: number;
        total_earned: number;
        total_spent: number;
        transaction_count: number;
    }>;
}
export default AGCBalanceModel;
//# sourceMappingURL=agc_balance.model.d.ts.map