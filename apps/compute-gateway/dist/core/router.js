"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterError = exports.Router = void 0;
const adapters_1 = require("../adapters");
const load_balancer_1 = require("./load-balancer");
const circuit_breaker_1 = require("./circuit-breaker");
/**
 * 智能路由器
 */
class Router {
    adapters = new Map();
    configs = new Map();
    loadBalancer = new load_balancer_1.LoadBalancer();
    circuitManager = new circuit_breaker_1.CircuitBreakerManager();
    healthCheckInterval;
    /**
     * 注册供应商
     */
    registerProvider(config) {
        console.log(`Registering provider: ${config.name} (${config.type})`);
        let adapter;
        switch (config.type) {
            case 'openai':
                adapter = new adapters_1.OpenAIAdapter(config);
                break;
            case 'anthropic':
                adapter = new adapters_1.AnthropicAdapter(config);
                break;
            case 'qwen':
            case 'glm':
            case 'deepseek':
                adapter = new adapters_1.DomesticAdapter(config, config.type);
                break;
            case 'gpu':
                adapter = new adapters_1.GPUAdapter(config);
                break;
            default:
                throw new Error(`Unknown provider type: ${config.type}`);
        }
        this.adapters.set(config.name, adapter);
        this.configs.set(config.name, config);
        // 注册熔断器
        this.circuitManager.getBreaker(config.name, {
            failureThreshold: 5,
            successThreshold: 3,
            timeout: 60,
            errorRateThreshold: 0.5,
            halfOpenMaxCalls: 3,
        });
    }
    /**
     * 路由请求
     */
    async route(request) {
        const startTime = Date.now();
        // 获取决策
        const decision = this.makeRoutingDecision(request);
        if (!decision) {
            throw new RouterError('No available providers');
        }
        console.log(`Routing request to ${decision.providerName}`);
        // 尝试主供应商和备选
        const providersToTry = [decision.providerName, ...decision.fallbackProviders];
        let lastError = null;
        for (const providerName of providersToTry) {
            const adapter = this.adapters.get(providerName);
            if (!adapter)
                continue;
            const breaker = this.circuitManager.getBreaker(providerName);
            try {
                const response = await breaker.call(() => adapter.chatCompletion(request));
                response.latencyMs = Date.now() - startTime;
                // 计算成本
                response.cost = adapter.calculateCost(response.model, response.usage);
                console.log(`Request succeeded on ${providerName}`);
                return response;
            }
            catch (error) {
                lastError = error;
                console.warn(`Provider ${providerName} failed: ${error}`);
            }
        }
        throw lastError || new RouterError('All providers failed');
    }
    /**
     * 流式路由
     */
    async *routeStream(request) {
        const decision = this.makeRoutingDecision(request);
        if (!decision) {
            throw new RouterError('No available providers');
        }
        const adapter = this.adapters.get(decision.providerName);
        if (!adapter) {
            throw new RouterError(`Adapter not found: ${decision.providerName}`);
        }
        const breaker = this.circuitManager.getBreaker(decision.providerName);
        try {
            yield* breaker.call(() => adapter.chatCompletionStream(request));
        }
        catch (error) {
            console.error(`Stream failed on ${decision.providerName}:`, error);
            // 尝试备选
            for (const fallback of decision.fallbackProviders) {
                const fallbackAdapter = this.adapters.get(fallback);
                if (fallbackAdapter) {
                    try {
                        console.log(`Falling back to ${fallback}`);
                        yield* fallbackAdapter.chatCompletionStream(request);
                        return;
                    }
                    catch {
                        continue;
                    }
                }
            }
            throw error;
        }
    }
    /**
     * 做出路由决策
     */
    makeRoutingDecision(request) {
        const statuses = new Map();
        this.adapters.forEach((adapter, name) => {
            statuses.set(name, adapter.status);
        });
        return this.loadBalancer.selectProvider(request, statuses, this.configs);
    }
    /**
     * 启动健康检查
     */
    startHealthChecks(intervalMs = 30000) {
        this.healthCheckInterval = setInterval(async () => {
            await this.checkAllProviders();
        }, intervalMs);
    }
    /**
     * 停止健康检查
     */
    stopHealthChecks() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
    }
    /**
     * 检查所有供应商
     */
    async checkAllProviders() {
        const promises = [];
        this.adapters.forEach((adapter, name) => {
            promises.push(this.checkProvider(name, adapter));
        });
        await Promise.all(promises);
    }
    /**
     * 检查单个供应商
     */
    async checkProvider(name, adapter) {
        try {
            const isHealthy = await adapter.healthCheck();
            adapter.status.isAvailable = isHealthy;
            adapter.status.lastCheck = new Date();
        }
        catch (error) {
            adapter.status.isAvailable = false;
            adapter.status.lastCheck = new Date();
        }
    }
    /**
     * 获取供应商状态
     */
    getProviderStatus() {
        const status = {};
        this.adapters.forEach((adapter, name) => {
            status[name] = {
                available: adapter.status.isAvailable,
                latencyMs: adapter.status.latencyMs,
                errorRate: adapter.status.errorRate,
                load: adapter.status.currentLoad,
                circuitState: adapter.status.circuitState,
            };
        });
        return status;
    }
    /**
     * 获取所有适配器
     */
    getAdapters() {
        return this.adapters;
    }
    /**
     * 关闭
     */
    async close() {
        this.stopHealthChecks();
    }
}
exports.Router = Router;
/**
 * 路由错误
 */
class RouterError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RouterError';
    }
}
exports.RouterError = RouterError;
//# sourceMappingURL=router.js.map