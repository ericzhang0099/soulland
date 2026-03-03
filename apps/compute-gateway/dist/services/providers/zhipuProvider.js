"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZhipuProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../utils/logger");
class ZhipuProvider {
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
            timeout: 120000,
        });
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
        const zhipuBody = this.convertToZhipuFormat(body);
        const response = await this.client.post('/chat/completions', zhipuBody);
        return response.data;
    }
    async streamChatCompletions(body) {
        const zhipuBody = this.convertToZhipuFormat(body);
        zhipuBody.stream = true;
        const response = await this.client.post('/chat/completions', zhipuBody, {
            responseType: 'stream',
        });
        return response.data;
    }
    async healthCheck() {
        try {
            await this.client.get('/models', { timeout: 5000 });
            return true;
        }
        catch {
            return false;
        }
    }
    convertToZhipuFormat(body) {
        return {
            model: this.mapModel(body.model),
            messages: body.messages,
            temperature: body.temperature,
            max_tokens: body.max_tokens,
            top_p: body.top_p,
            stream: body.stream || false,
        };
    }
    mapModel(model) {
        const modelMap = {
            'glm-4': 'glm-4',
            'glm-3-turbo': 'glm-3-turbo',
        };
        return modelMap[model] || model;
    }
}
exports.ZhipuProvider = ZhipuProvider;
//# sourceMappingURL=zhipuProvider.js.map