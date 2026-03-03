"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.MODEL_COST_CONFIG = exports.MODEL_PROVIDER_MAP = void 0;
// 模型映射配置
exports.MODEL_PROVIDER_MAP = {
    'gpt-4': ['openai'],
    'gpt-4-turbo': ['openai'],
    'gpt-4o': ['openai'],
    'gpt-3.5-turbo': ['openai'],
    'claude-3-opus': ['anthropic'],
    'claude-3-sonnet': ['anthropic'],
    'claude-3-haiku': ['anthropic'],
    'qwen-turbo': ['aliyun'],
    'qwen-plus': ['aliyun'],
    'qwen-max': ['aliyun'],
    'glm-4': ['zhipu'],
    'glm-3-turbo': ['zhipu'],
};
// 成本配置（每1000 tokens的AGC积分消耗）
exports.MODEL_COST_CONFIG = {
    'gpt-4': { input: 30, output: 60 },
    'gpt-4-turbo': { input: 10, output: 30 },
    'gpt-4o': { input: 5, output: 15 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    'claude-3-opus': { input: 15, output: 75 },
    'claude-3-sonnet': { input: 3, output: 15 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
    'qwen-turbo': { input: 0.5, output: 1 },
    'qwen-plus': { input: 2, output: 6 },
    'qwen-max': { input: 5, output: 10 },
    'glm-4': { input: 10, output: 10 },
    'glm-3-turbo': { input: 1, output: 1 },
};
const parseProviders = () => {
    const providers = [];
    // OpenAI
    if (process.env.OPENAI_ENABLED === 'true') {
        providers.push({
            name: 'openai',
            type: 'openai',
            apiKey: process.env.OPENAI_API_KEY || '',
            baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
            enabled: true,
            priority: parseInt(process.env.OPENAI_PRIORITY || '1'),
            models: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'],
            rateLimitPerMinute: parseInt(process.env.OPENAI_RATE_LIMIT || '60'),
        });
    }
    // Anthropic
    if (process.env.ANTHROPIC_ENABLED === 'true') {
        providers.push({
            name: 'anthropic',
            type: 'anthropic',
            apiKey: process.env.ANTHROPIC_API_KEY || '',
            baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
            enabled: true,
            priority: parseInt(process.env.ANTHROPIC_PRIORITY || '2'),
            models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
            rateLimitPerMinute: parseInt(process.env.ANTHROPIC_RATE_LIMIT || '60'),
        });
    }
    // 阿里云百炼
    if (process.env.ALIYUN_ENABLED === 'true') {
        providers.push({
            name: 'aliyun',
            type: 'aliyun',
            apiKey: process.env.ALIYUN_API_KEY || '',
            baseUrl: process.env.ALIYUN_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1',
            enabled: true,
            priority: parseInt(process.env.ALIYUN_PRIORITY || '3'),
            models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
            rateLimitPerMinute: parseInt(process.env.ALIYUN_RATE_LIMIT || '60'),
        });
    }
    // 智谱AI
    if (process.env.ZHIPU_ENABLED === 'true') {
        providers.push({
            name: 'zhipu',
            type: 'zhipu',
            apiKey: process.env.ZHIPU_API_KEY || '',
            baseUrl: process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
            enabled: true,
            priority: parseInt(process.env.ZHIPU_PRIORITY || '4'),
            models: ['glm-4', 'glm-3-turbo'],
            rateLimitPerMinute: parseInt(process.env.ZHIPU_RATE_LIMIT || '60'),
        });
    }
    return providers.sort((a, b) => a.priority - b.priority);
};
exports.config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001'),
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
    databaseUrl: process.env.DATABASE_URL || '',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    providers: parseProviders(),
    circuitBreaker: {
        failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5'),
        resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '30000'),
        halfOpenRequests: parseInt(process.env.CIRCUIT_BREAKER_HALF_OPEN_REQUESTS || '3'),
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    },
    logLevel: process.env.LOG_LEVEL || 'info',
    logFormat: process.env.LOG_FORMAT || 'json',
    agcApiUrl: process.env.AGC_API_URL || '',
    agcApiKey: process.env.AGC_API_KEY || '',
};
//# sourceMappingURL=config.js.map