import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                apiKey: string;
                email?: string;
            };
        }
    }
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuthMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map