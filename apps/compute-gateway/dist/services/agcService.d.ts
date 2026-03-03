declare class AGCService {
    private client;
    getBalance(userId: string): Promise<number>;
    getHoldAmount(userId: string): Promise<number>;
    holdBalance(userId: string, amount: number, requestId: string): Promise<string>;
    releaseHold(holdId: string): Promise<void>;
    deductBalance(userId: string, amount: number, requestId: string): Promise<void>;
    refundBalance(userId: string, amount: number, requestId: string): Promise<void>;
}
export declare const agcService: AGCService;
export {};
//# sourceMappingURL=agcService.d.ts.map