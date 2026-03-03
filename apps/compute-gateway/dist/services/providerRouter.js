"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerRouter = void 0;
const config_1 = require("../config");
const openaiProvider_1 = require("./providers/openaiProvider");
const anthropicProvider_1 = require("./providers/anthropicProvider");
const aliyunProvider_1 = require("./providers/aliyunProvider");
const zhipuProvider_1 = require("./providers/zhipuProvider");
const logger_1 = require("../utils/logger");
class ProviderRouter {
    providers = new Map();
    circuitBreakers = new Map();
    constructor() {
        this.initializeProviders();
    }
    initializeProviders() {
        for (const providerConfig of config_1.config.providers) {
            let provider;
            switch (providerConfig.type) {
                case 'openai':
                    provider = new openaiProvider_1.OpenAIProvider(providerConfig);
                    break;
                case 'anthropic':
                    provider = new anthropicProvider_1.AnthropicProvider(providerConfig);
                    break;
                case 'aliyun':
                    provider = new aliyunProvider_1.AliyunProvider(providerConfig);
                    break;
                case 'zhipu':
                    provider = new zhipuProvider_1.ZhipuProvider(providerConfig);
                    break;
                default:
                    logger_1.logger.warn(`未知的供应商类型: ${providerConfig.type}`);
                    continue;
            }
            this.providers.set(providerConfig.name, provider);
            this.circuitBreakers.set(providerConfig.name, new CircuitBreaker(providerConfig.name, config_1.config.circuitBreaker));
            logger_1.logger.info(`供应商已初始化: ${providerConfig.name}`);
        }
    }
    // 选择最佳供应商
    selectProvider(model) {
        const supportedProviders = config_1.MODEL_PROVIDER_MAP[model];
        if (!supportedProviders) {
            logger_1.logger.warn(`模型 ${model} 没有配置对应的供应商`);
            return null;
        }
        // 按优先级排序，选择可用的供应商
        const candidates = [];
        for (const providerName of supportedProviders) {
            const provider = this.providers.get(providerName);
            const breaker = this.circuitBreakers.get(providerName);
            if (provider?.enabled && breaker?.canExecute()) {
                candidates.push(provider);
            }
        }
        // 按优先级排序
        candidates.sort((a, b) => a.priority - b.priority);
        if (candidates.length === 0) {
            logger_1.logger.warn(`模型 ${model} 没有可用的供应商`);
            return null;
        }
        return candidates[0];
    }
    // 获取所有可用供应商
    getAvailableProviders() {
        const available = [];
        for (const [name, provider] of this.providers) {
            const breaker = this.circuitBreakers.get(name);
            if (provider.enabled && breaker?.canExecute()) {
                available.push(provider);
            }
        }
        return available;
    }
    // 记录成功
    recordSuccess(providerName) {
        const breaker = this.circuitBreakers.get(providerName);
        breaker?.recordSuccess();
    }
    // 记录失败
    recordFailure(providerName) {
        const breaker = this.circuitBreakers.get(providerName);
        breaker?.recordFailure();
    }
    // 获取熔断器状态
    getCircuitBreakerStatus() {
        const status = {};
        for (const [name, breaker] of this.circuitBreakers) {
            status[name] = breaker.getStatus();
        }
        return status;
    }
}
// 熔断器实现
class CircuitBreaker {
    state = 'CLOSED';
    failureCount = 0;
    successCount = 0;
    lastFailureTime;
    config;
    name;
    constructor(name, config) {
        this.name = name;
        this.config = config;
    }
    canExecute() {
        if (this.state === 'CLOSED') {
            return true;
        }
        if (this.state === 'OPEN') {
            const now = Date.now();
            if (this.lastFailureTime && now - this.lastFailureTime >= this.config.resetTimeout) {
                this.state = 'HALF_OPEN';
                this.successCount = 0;
                this.failureCount = 0;
                logger_1.logger.info(`熔断器 ${this.name} 进入半开状态`);
                return true;
            }
            return false;
        }
        // HALF_OPEN状态
        return this.successCount + this.failureCount < this.config.halfOpenRequests;
    }
    recordSuccess() {
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= this.config.halfOpenRequests) {
                this.state = 'CLOSED';
                this.failureCount = 0;
                this.successCount = 0;
                logger_1.logger.info(`熔断器 ${this.name} 关闭`);
            }
        }
        else {
            this.failureCount = 0;
        }
    }
    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
            logger_1.logger.warn(`熔断器 ${this.name} 打开（半开状态失败）`);
        }
        else if (this.state === 'CLOSED' && this.failureCount >= this.config.failureThreshold) {
            this.state = 'OPEN';
            logger_1.logger.warn(`熔断器 ${this.name} 打开（失败次数: ${this.failureCount}）`);
        }
    }
    getStatus() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
        };
    }
}
exports.providerRouter = new ProviderRouter();
//# sourceMappingURL=providerRouter.js.map