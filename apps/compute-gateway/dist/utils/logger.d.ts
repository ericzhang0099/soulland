import winston from 'winston';
export declare const logger: winston.Logger;
export declare const createRequestLogger: (requestId: string) => winston.Logger;
export declare const logPerformance: (operation: string, durationMs: number, metadata?: Record<string, unknown>) => void;
export declare const logError: (error: Error, context?: Record<string, unknown>) => void;
//# sourceMappingURL=logger.d.ts.map