"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContainer = createContainer;
exports.registerProviders = registerProviders;
const router_1 = require("../core/router");
const points_service_1 = require("../services/points.service");
const quota_service_1 = require("../services/quota.service");
const compute_service_1 = require("../services/compute.service");
/**
 * 创建依赖容器
 */
function createContainer() {
    // 核心组件
    const router = new router_1.Router();
    // 服务
    const pointsService = new points_service_1.PointsService(process.env.RPC_URL || 'http://localhost:8545', process.env.POINTS_CONTRACT_ADDRESS || '', process.env.COMPUTE_CONTRACT_ADDRESS || '', process.env.GATEWAY_PRIVATE_KEY);
    const quotaService = new quota_service_1.QuotaService(process.env.REDIS_URL || 'redis://localhost:6379');
    const computeService = new compute_service_1.ComputeService(router, pointsService, quotaService);
    return {
        router,
        pointsService,
        quotaService,
        computeService,
    };
}
/**
 * 注册供应商
 */
function registerProviders(router) {
    // OpenAI
    if (process.env.OPENAI_API_KEY) {
        router.registerProvider({
            name: 'openai',
            type: 'openai',
            baseUrl: 'https://api.openai.com/v1',
            apiKey: process.env.OPENAI_API_KEY,
            models: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'],
            weight: 1,
            maxRpm: 3000,
            maxTpm: 250000,
            timeout: 60,
            retryAttempts: 3,
            enabled: true,
            costMultiplier: 1,
        });
    }
    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
        router.registerProvider({
            name: 'anthropic',
            type: 'anthropic',
            baseUrl: 'https://api.anthropic.com/v1',
            apiKey: process.env.ANTHROPIC_API_KEY,
            models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
            weight: 1,
            maxRpm: 1000,
            maxTpm: 100000,
            timeout: 60,
            retryAttempts: 3,
            enabled: true,
            costMultiplier: 1.2,
        });
    }
    // 通义千问
    if (process.env.QWEN_API_KEY) {
        router.registerProvider({
            name: 'qwen',
            type: 'qwen',
            baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
            apiKey: process.env.QWEN_API_KEY,
            models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
            weight: 1,
            maxRpm: 1000,
            maxTpm: 1000000,
            timeout: 60,
            retryAttempts: 3,
            enabled: true,
            costMultiplier: 0.6,
        });
    }
    // 智谱GLM
    if (process.env.GLM_API_KEY) {
        router.registerProvider({
            name: 'glm',
            type: 'glm',
            baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
            apiKey: process.env.GLM_API_KEY,
            models: ['glm-4', 'glm-4-flash'],
            weight: 1,
            maxRpm: 500,
            maxTpm: 500000,
            timeout: 60,
            retryAttempts: 3,
            enabled: true,
            costMultiplier: 0.5,
        });
    }
    // DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
        router.registerProvider({
            name: 'deepseek',
            type: 'deepseek',
            baseUrl: 'https://api.deepseek.com/v1',
            apiKey: process.env.DEEPSEEK_API_KEY,
            models: ['deepseek-chat', 'deepseek-coder'],
            weight: 1,
            maxRpm: 1000,
            maxTpm: 1000000,
            timeout: 60,
            retryAttempts: 3,
            enabled: true,
            costMultiplier: 0.3,
        });
    }
    // GPU推理服务
    if (process.env.GPU_API_URL) {
        router.registerProvider({
            name: 'gpu-local',
            type: 'gpu',
            baseUrl: process.env.GPU_API_URL,
            apiKey: process.env.GPU_API_KEY || '',
            models: ['llama-2-70b', 'qwen-72b'],
            weight: 2,
            maxRpm: 100,
            maxTpm: 50000,
            timeout: 120,
            retryAttempts: 2,
            enabled: true,
            costMultiplier: 0.2,
        });
    }
}
//# sourceMappingURL=container.js.map