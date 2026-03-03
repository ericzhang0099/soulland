export interface Provider {
    name: string;
    type: string;
    enabled: boolean;
    priority: number;
    chatCompletions(body: any): Promise<any>;
    streamChatCompletions(body: any): Promise<any>;
    healthCheck(): Promise<boolean>;
}
declare class ProviderRouter {
    private providers;
    private circuitBreakers;
    constructor();
    private initializeProviders;
    selectProvider(model: string): Provider | null;
    getAvailableProviders(): Provider[];
    recordSuccess(providerName: string): void;
    recordFailure(providerName: string): void;
    getCircuitBreakerStatus(): Record<string, any>;
}
export declare const providerRouter: ProviderRouter;
export {};
//# sourceMappingURL=providerRouter.d.ts.map