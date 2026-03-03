export interface ProviderConfig {
    name: string;
    type: 'openai' | 'anthropic' | 'aliyun' | 'zhipu';
    apiKey: string;
    baseUrl: string;
    enabled: boolean;
    priority: number;
    models: string[];
    rateLimitPerMinute: number;
}
export interface AppConfig {
    nodeEnv: string;
    port: number;
    corsOrigins: string[];
    databaseUrl: string;
    redisUrl: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    providers: ProviderConfig[];
    circuitBreaker: {
        failureThreshold: number;
        resetTimeout: number;
        halfOpenRequests: number;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    logLevel: string;
    logFormat: 'json' | 'text';
    agcApiUrl: string;
    agcApiKey: string;
}
export declare const MODEL_PROVIDER_MAP: Record<string, string[]>;
export declare const MODEL_COST_CONFIG: Record<string, {
    input: number;
    output: number;
}>;
export declare const config: AppConfig;
//# sourceMappingURL=config.d.ts.map