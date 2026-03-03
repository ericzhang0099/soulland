"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterError = exports.BaseAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * 供应商适配器基类
 */
class BaseAdapter {
    config;
    client;
    status;
    requestCount = 0;
    errorCount = 0;
    results = [];
    constructor(config) {
        this.config = config;
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.timeout * 1000,
            headers: this.getHeaders(),
        });
        this.status = {
            name: config.name,
            type: config.type,
            isAvailable: true,
            latencyMs: 0,
            errorRate: 0,
            currentLoad: 0,
            queueLength: 0,
            lastCheck: new Date(),
            circuitState: 'closed',
        };
    }
    /**
     * 非流式聊天完成
     */
    async chatCompletion(request) {
        const startTime = Date.now();
        try {
            const payload = this.convertRequest(request);
            const response = await this.client.post('/chat/completions', payload);
            const latency = Date.now() - startTime;
            const result = this.convertResponse(response.data, request.user || 'anonymous');
            result.latencyMs = latency;
            result.provider = this.config.name;
            await this.updateStatus(true, latency);
            return result;
        }
        catch (error) {
            await this.updateStatus(false);
            throw new AdapterError(`${this.config.name} request failed: ${error}`);
        }
    }
    /**
     * 流式聊天完成
     */
    async *chatCompletionStream(request) {
        const payload = this.convertRequest(request);
        payload.stream = true;
        try {
            const response = await this.client.post('/chat/completions', payload, {
                responseType: 'stream',
            });
            for await (const chunk of response.data) {
                const lines = chunk.toString().split('\n').filter((line) => line.trim());
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]')
                            return;
                        try {
                            const parsed = JSON.parse(data);
                            const streamChunk = this.convertStreamChunk(parsed);
                            if (streamChunk)
                                yield streamChunk;
                        }
                        catch {
                            continue;
                        }
                    }
                }
            }
            await this.updateStatus(true, 0);
        }
        catch (error) {
            await this.updateStatus(false);
            throw new AdapterError(`${this.config.name} stream request failed: ${error}`);
        }
    }
    /**
     * 健康检查
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/models', { timeout: 5000 });
            const isHealthy = response.status === 200;
            this.status.isAvailable = isHealthy;
            this.status.lastCheck = new Date();
            return isHealthy;
        }
        catch {
            this.status.isAvailable = false;
            this.status.lastCheck = new Date();
            return false;
        }
    }
    /**
     * 更新状态
     */
    async updateStatus(success, latency = 0) {
        this.requestCount++;
        if (!success)
            this.errorCount++;
        // 滑动窗口错误率
        this.results.push(success);
        if (this.results.length > 100)
            this.results.shift();
        this.status.errorRate = this.results.filter(r => !r).length / this.results.length;
        // 更新延迟（指数移动平均）
        if (latency > 0) {
            const alpha = 0.3;
            this.status.latencyMs = this.status.latencyMs
                ? alpha * latency + (1 - alpha) * this.status.latencyMs
                : latency;
        }
        this.status.lastCheck = new Date();
    }
    /**
     * 计算成本
     */
    calculateCost(model, usage) {
        const pricing = this.getModelPricing(model);
        const inputCost = (usage.promptTokens / 1000) * pricing.input;
        const outputCost = (usage.completionTokens / 1000) * pricing.output;
        return (inputCost + outputCost) * this.config.costMultiplier;
    }
    get isAvailable() {
        return this.status.isAvailable && this.config.enabled;
    }
}
exports.BaseAdapter = BaseAdapter;
/**
 * 适配器错误
 */
class AdapterError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AdapterError';
    }
}
exports.AdapterError = AdapterError;
//# sourceMappingURL=base.js.map