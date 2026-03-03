"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerManager = exports.CircuitBreakerOpenError = exports.CircuitBreaker = void 0;
/**
 * 熔断器 - 防止级联故障
 */
class CircuitBreaker {
    name;
    config;
    state = 'closed';
    failureCount = 0;
    successCount = 0;
    halfOpenCalls = 0;
    lastFailureTime;
    results = [];
    constructor(name, config) {
        this.name = name;
        this.config = config;
    }
    /**
     * 执行受保护的调用
     */
    async call(fn) {
        if (!this.canExecute()) {
            throw new CircuitBreakerOpenError(`Circuit breaker '${this.name}' is OPEN`);
        }
        try {
            const result = await fn();
            await this.onSuccess();
            return result;
        }
        catch (error) {
            await this.onFailure();
            throw error;
        }
    }
    canExecute() {
        if (this.state === 'closed')
            return true;
        if (this.state === 'open') {
            if (this.lastFailureTime) {
                const elapsed = (Date.now() - this.lastFailureTime.getTime()) / 1000;
                if (elapsed >= this.config.timeout) {
                    console.log(`Circuit '${this.name}' transitioning to HALF_OPEN`);
                    this.state = 'half-open';
                    this.halfOpenCalls = 0;
                    this.successCount = 0;
                    return true;
                }
            }
            return false;
        }
        if (this.state === 'half-open') {
            if (this.halfOpenCalls < this.config.halfOpenMaxCalls) {
                this.halfOpenCalls++;
                return true;
            }
            return false;
        }
        return false;
    }
    async onSuccess() {
        this.recordResult(true);
        if (this.state === 'half-open') {
            this.successCount++;
            if (this.successCount >= this.config.successThreshold) {
                console.log(`Circuit '${this.name}' transitioning to CLOSED`);
                this.reset();
            }
        }
    }
    async onFailure() {
        this.recordResult(false);
        this.failureCount++;
        this.lastFailureTime = new Date();
        if (this.state === 'half-open') {
            console.warn(`Circuit '${this.name}' transitioning to OPEN (half-open failure)`);
            this.state = 'open';
        }
        else if (this.state === 'closed') {
            const errorRate = this.calculateErrorRate();
            if (this.failureCount >= this.config.failureThreshold ||
                errorRate >= this.config.errorRateThreshold) {
                console.warn(`Circuit '${this.name}' transitioning to OPEN`);
                this.state = 'open';
            }
        }
    }
    recordResult(success) {
        this.results.push(success);
        if (this.results.length > 100)
            this.results.shift();
    }
    calculateErrorRate() {
        if (this.results.length === 0)
            return 0;
        return this.results.filter(r => !r).length / this.results.length;
    }
    reset() {
        this.state = 'closed';
        this.failureCount = 0;
        this.successCount = 0;
        this.halfOpenCalls = 0;
        this.results = [];
    }
    get isOpen() {
        return this.state === 'open';
    }
    getStats() {
        return {
            name: this.name,
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            errorRate: this.calculateErrorRate(),
            lastFailure: this.lastFailureTime?.toISOString(),
        };
    }
}
exports.CircuitBreaker = CircuitBreaker;
/**
 * 熔断器打开错误
 */
class CircuitBreakerOpenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CircuitBreakerOpenError';
    }
}
exports.CircuitBreakerOpenError = CircuitBreakerOpenError;
/**
 * 熔断器管理器
 */
class CircuitBreakerManager {
    breakers = new Map();
    defaultConfig = {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 60,
        errorRateThreshold: 0.5,
        halfOpenMaxCalls: 3,
    };
    getBreaker(name, config) {
        if (!this.breakers.has(name)) {
            this.breakers.set(name, new CircuitBreaker(name, config || this.defaultConfig));
        }
        return this.breakers.get(name);
    }
    healthCheck() {
        const stats = {};
        this.breakers.forEach((breaker, name) => {
            stats[name] = breaker.getStats();
        });
        return stats;
    }
    resetAll() {
        this.breakers.clear();
    }
}
exports.CircuitBreakerManager = CircuitBreakerManager;
//# sourceMappingURL=circuit-breaker.js.map