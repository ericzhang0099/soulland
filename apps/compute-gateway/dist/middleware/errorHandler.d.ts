import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string, isOperational?: boolean);
}
export declare const Errors: {
    UNAUTHORIZED: (message?: string) => AppError;
    FORBIDDEN: (message?: string) => AppError;
    BAD_REQUEST: (message?: string) => AppError;
    NOT_FOUND: (message?: string) => AppError;
    INSUFFICIENT_BALANCE: (message?: string) => AppError;
    RATE_LIMIT_EXCEEDED: (message?: string) => AppError;
    MODEL_NOT_AVAILABLE: (message?: string) => AppError;
    PROVIDER_ERROR: (message?: string) => AppError;
    INTERNAL_ERROR: (message?: string) => AppError;
};
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map