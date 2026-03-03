"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicAdapter = void 0;
const base_1 = require("./base");
/**
 * Anthropic Claude 适配器
 */
class AnthropicAdapter extends base_1.BaseAdapter {
    constructor(config) {
        super(config);
        this.config.type = 'anthropic';
    }
    getHeaders() {
        return {
            'x-api-key': this.config.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
        };
    }
    convertRequest(request) {
        // 分离system消息
        const systemMessage = request.messages.find(m => m.role === 'system');
        const messages = request.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
            role: m.role,
            content: m.content,
        }));
        const payload = {
            model: request.model,
            messages,
            max_tokens: request.maxTokens || 4096,
            temperature: request.temperature ?? 0.7,
            stream: request.stream ?? false,
        };
        if (systemMessage) {
            payload.system = systemMessage.content;
        }
        return payload;
    }
    convertResponse(response, requestId) {
        const content = response.content
            ?.filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join('') || '';
        const usage = response.usage;
        return {
            id: response.id,
            model: response.model,
            content,
            usage: {
                promptTokens: usage?.input_tokens || 0,
                completionTokens: usage?.output_tokens || 0,
                totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
            },
            cost: 0,
            provider: this.config.name,
            latencyMs: 0,
            finishReason: response.stop_reason,
        };
    }
    convertStreamChunk(chunk) {
        if (chunk.type === 'content_block_delta') {
            return {
                id: chunk.index?.toString() || '',
                model: '',
                content: chunk.delta?.text || '',
            };
        }
        return null;
    }
    getModelPricing(model) {
        const pricing = {
            'claude-3-opus-20240229': { input: 15, output: 75 },
            'claude-3-sonnet-20240229': { input: 3, output: 15 },
            'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
        };
        return pricing[model] || { input: 3, output: 15 };
    }
}
exports.AnthropicAdapter = AnthropicAdapter;
//# sourceMappingURL=anthropic.js.map