"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComputeRoutes = createComputeRoutes;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
/**
 * 算力路由
 */
function createComputeRoutes(computeService) {
    const router = (0, express_1.Router)();
    /**
     * 聊天完成
     * POST /v1/chat/completions
     */
    router.post('/chat/completions', [
        (0, express_validator_1.body)('model').isString().notEmpty(),
        (0, express_validator_1.body)('messages').isArray({ min: 1 }),
        (0, express_validator_1.body)('messages.*.role').isIn(['system', 'user', 'assistant']),
        (0, express_validator_1.body)('messages.*.content').isString(),
        (0, express_validator_1.body)('temperature').optional().isFloat({ min: 0, max: 2 }),
        (0, express_validator_1.body)('max_tokens').optional().isInt({ min: 1 }),
        (0, express_validator_1.body)('stream').optional().isBoolean(),
    ], async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        // 从JWT或header获取用户地址
        const userAddress = req.user?.address || req.headers['x-user-address'];
        if (!userAddress) {
            return res.status(401).json({ error: 'User address required' });
        }
        const request = {
            model: req.body.model,
            messages: req.body.messages,
            temperature: req.body.temperature,
            maxTokens: req.body.max_tokens,
            stream: req.body.stream || false,
            user: userAddress,
            priority: req.body.priority || 'normal',
        };
        try {
            // 流式响应
            if (request.stream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                const generator = computeService.chatCompletionStream(request, userAddress);
                for await (const chunk of generator) {
                    const data = {
                        id: chunk.id,
                        object: 'chat.completion.chunk',
                        created: Math.floor(Date.now() / 1000),
                        model: request.model,
                        choices: [{
                                index: 0,
                                delta: { content: chunk.content },
                                finish_reason: chunk.finishReason,
                            }],
                    };
                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                }
                res.write('data: [DONE]\n\n');
                return res.end();
            }
            // 非流式响应
            const response = await computeService.chatCompletion(request, userAddress);
            res.json({
                id: response.id,
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: response.model,
                choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: response.content,
                        },
                        finish_reason: response.finishReason,
                    }],
                usage: {
                    prompt_tokens: response.usage.promptTokens,
                    completion_tokens: response.usage.completionTokens,
                    total_tokens: response.usage.totalTokens,
                },
                cost: response.cost,
                provider: response.provider,
            });
        }
        catch (error) {
            console.error('Chat completion error:', error);
            if (error.name === 'ComputeError') {
                return res.status(429).json({
                    error: error.message,
                    code: 'COMPUTE_ERROR'
                });
            }
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });
    /**
     * 列出可用模型
     * GET /v1/models
     */
    router.get('/models', (req, res) => {
        const models = computeService.getAvailableModels();
        res.json({
            object: 'list',
            data: models.map(m => ({
                id: m.id,
                object: 'model',
                owned_by: m.provider,
                pricing: {
                    input: m.inputPrice,
                    output: m.outputPrice,
                },
            })),
        });
    });
    /**
     * 获取用户统计
     * GET /v1/users/me/stats
     */
    router.get('/users/me/stats', async (req, res) => {
        const userAddress = req.user?.address || req.headers['x-user-address'];
        if (!userAddress) {
            return res.status(401).json({ error: 'User address required' });
        }
        try {
            const stats = await computeService.getUserStats(userAddress);
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    /**
     * 估算成本
     * POST /v1/cost/estimate
     */
    router.post('/cost/estimate', [
        (0, express_validator_1.body)('model').isString(),
        (0, express_validator_1.body)('messages').isArray(),
    ], async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { model, messages } = req.body;
        // 估算token数
        const estimatedTokens = messages.reduce((sum, m) => sum + (m.content?.length || 0) * 0.4, 0) + 100;
        // 获取模型定价
        const models = computeService.getAvailableModels();
        const modelInfo = models.find(m => m.id === model);
        if (!modelInfo) {
            return res.status(404).json({ error: 'Model not found' });
        }
        const inputCost = (estimatedTokens / 1000) * modelInfo.inputPrice;
        const outputCost = (estimatedTokens / 1000) * modelInfo.outputPrice;
        res.json({
            model,
            estimated_tokens: Math.ceil(estimatedTokens),
            estimated_cost: {
                input: inputCost,
                output: outputCost,
                total: inputCost + outputCost,
            },
            pricing: {
                input_per_1k: modelInfo.inputPrice,
                output_per_1k: modelInfo.outputPrice,
            },
        });
    });
    return router;
}
//# sourceMappingURL=compute.routes.js.map