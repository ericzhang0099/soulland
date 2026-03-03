"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class OpenAIProvider {
    name;
    type;
    enabled;
    priority;
    client;
    constructor(config) {
        this.name = config.name;
        this.type = config.type;
        this.enabled = config.enabled;
        this.priority = config.priority;
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 120000, // 2分钟超时
        });
        // 响应拦截器
        this.client.interceptors.response.use((response) => response, (error) => {
            logger_1.logger.error({
                provider: this.name,
                error: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            return Promise.reject(error);
        });
    }
    async chatCompletions(body) {
        const response = await this.client.post('/chat/completions', body);
        return response.data;
    }
    async streamChatCompletions(body) {
        const response = await this.client.post('/chat/completions', { ...body, stream: true }, { responseType: 'stream' });
        return response.data;
    }
    async healthCheck() {
        try {
            // 使用models接口检查健康状态
            await this.client.get('/models', { timeout: 5000 });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=openaiProvider.js.map