"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AliyunProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../utils/logger");
class AliyunProvider {
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
        const aliyunBody = this.convertToAliyunFormat(body);
        const response = await this.client.post('/services/aigc/text-generation/generation', aliyunBody);
        return this.convertToOpenAIFormat(response.data, body.model);
    }
    async streamChatCompletions(body) {
        const aliyunBody = this.convertToAliyunFormat(body);
        aliyunBody.parameters.stream = true;
        const response = await this.client.post('/services/aigc/text-generation/generation', aliyunBody, {
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
    convertToAliyunFormat(body) {
        const messages = body.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));
        return {
            model: this.mapModel(body.model),
            input: {
                messages,
            },
            parameters: {
                temperature: body.temperature,
                max_tokens: body.max_tokens,
                top_p: body.top_p,
                stream: body.stream || false,
            },
        };
    }
    convertToOpenAIFormat(aliyunResponse, model) {
        const output = aliyunResponse.output || {};
        const usage = aliyunResponse.usage || {};
        return {
            id: aliyunResponse.request_id || `aliyun-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: output.text || output.message?.content || '',
                    },
                    finish_reason: output.finish_reason || 'stop',
                }],
            usage: {
                prompt_tokens: usage.input_tokens || 0,
                completion_tokens: usage.output_tokens || 0,
                total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
            },
        };
    }
    mapModel(model) {
        const modelMap = {
            'qwen-turbo': 'qwen-turbo',
            'qwen-plus': 'qwen-plus',
            'qwen-max': 'qwen-max',
        };
        return modelMap[model] || model;
    }
}
exports.AliyunProvider = AliyunProvider;
//# sourceMappingURL=aliyunProvider.js.map