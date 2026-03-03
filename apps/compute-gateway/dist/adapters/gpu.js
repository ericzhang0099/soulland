"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPUAdapter = void 0;
const base_1 = require("./base");
/**
 * GPU推理服务适配器 (vLLM/TGI)
 */
class GPUAdapter extends base_1.BaseAdapter {
    constructor(config) {
        super(config);
        this.config.type = 'gpu';
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
            })),
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens,
            stream: request.stream ?? false,
        };
    }
    convertResponse(response, requestId) {
        // vLLM兼容OpenAI格式
        const choice = response.choices?.[0];
        const usage = response.usage;
        return {
            id: response.id || requestId,
            model: response.model || this.config.models[0],
            content: choice?.message?.content || '',
            usage: {
                promptTokens: usage?.prompt_tokens || 0,
                completionTokens: usage?.completion_tokens || 0,
                totalTokens: usage?.total_tokens || 0,
            },
            cost: 0,
            provider: this.config.name,
            latencyMs: 0,
            finishReason: choice?.finish_reason,
        };
    }
    convertStreamChunk(chunk) {
        if (chunk.choices) {
            const delta = chunk.choices[0]?.delta;
            return {
                id: chunk.id,
                model: chunk.model,
                content: delta?.content || '',
            };
        }
        return null;
    }
    getModelPricing(model) {
        // GPU推理成本更低
        return { input: 0.05, output: 0.1 };
    }
    /**
     * 获取GPU状态
     */
    async getGPUStatus() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        }
        catch (error) {
            return { status: 'error', error: String(error) };
        }
    }
}
exports.GPUAdapter = GPUAdapter;
//# sourceMappingURL=gpu.js.map