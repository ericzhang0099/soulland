"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIAdapter = void 0;
const base_1 = require("./base");
/**
 * OpenAI 适配器
 */
class OpenAIAdapter extends base_1.BaseAdapter {
    constructor(config) {
        super(config);
        this.config.type = 'openai';
    }
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
        };
    }
    convertRequest(request) {
        return {
            model: request.model,
            messages: request.messages.map(m => ({
                role: m.role,
                content: m.content,
                name: m.name,
            })),
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens,
            stream: request.stream ?? false,
        };
    }
    convertResponse(response, requestId) {
        const choice = response.choices?.[0];
        const message = choice?.message;
        const usage = response.usage;
        return {
            id: response.id,
            model: response.model,
            content: message?.content || '',
            usage: {
                promptTokens: usage?.prompt_tokens || 0,
                completionTokens: usage?.completion_tokens || 0,
                totalTokens: usage?.total_tokens || 0,
            },
            cost: 0, // 由外部计算
            provider: this.config.name,
            latencyMs: 0,
            finishReason: choice?.finish_reason,
        };
    }
    convertStreamChunk(chunk) {
        const choice = chunk.choices?.[0];
        if (!choice)
            return null;
        const delta = choice.delta;
        return {
            id: chunk.id,
            model: chunk.model,
            content: delta?.content || '',
            finishReason: choice.finish_reason,
        };
    }
    getModelPricing(model) {
        // AGC积分定价 (1 AGC = 1000 积分单位)
        const pricing = {
            'gpt-4': { input: 30, output: 60 },
            'gpt-4-turbo': { input: 10, output: 30 },
            'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
            'gpt-3.5-turbo-0125': { input: 0.5, output: 1.5 },
        };
        return pricing[model] || { input: 1, output: 2 };
    }
}
exports.OpenAIAdapter = OpenAIAdapter;
//# sourceMappingURL=openai.js.map