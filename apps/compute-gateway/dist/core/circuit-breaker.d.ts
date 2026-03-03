import { CircuitBreakerConfig } from '../types';
/**
 * 熔断器 - 防止级联故障
 */
export declare class CircuitBreaker {
    private name;
    private config;
    private state;
    private failureCount;
    private successCount;
    private halfOpenCalls;
    private lastFailureTime?;
    private results;
    constructor(name: string, config: CircuitBreakerConfig);
    /**
     * 执行受保护的调用
     */
    call<T>(fn: () => Promise<T>): Promise<T>;
    private canExecute;
    private onSuccess;
    private onFailure;
    private recordResult;
    private calculateErrorRate;
    private reset;
    get isOpen(): boolean;
    getStats(): {
        name: string;
        state: "closed" | "open" | "half-open";
        failureCount: number;
        successCount: number;
        errorRate: number;
        lastFailure: string | undefined;
    };
}
/**
 * 熔断器打开错误
 */
export declare class CircuitBreakerOpenError extends Error {
    constructor(message: string);
}
/**
 * 熔断器管理器
 */
export declare class CircuitBreakerManager {
    private breakers;
    private defaultConfig;
    getBreaker(name: string, config?: CircuitBreakerConfig): CircuitBreaker;
    healthCheck(): Record<string, any>;
    resetAll(): void;
}
//# sourceMappingURL=circuit-breaker.d.ts.map