"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const errorHandler_1 = require("./errorHandler");
// API Key认证
const authMiddleware = (req, res, next) => {
    // 健康检查路径跳过认证
    if (req.path.startsWith('/health')) {
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next(errorHandler_1.Errors.UNAUTHORIZED('缺少Authorization头'));
    }
    // Bearer Token认证
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return next(errorHandler_1.Errors.UNAUTHORIZED('Authorization格式错误，应为: Bearer {token}'));
    }
    const token = parts[1];
    try {
        // 验证JWT
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(errorHandler_1.Errors.UNAUTHORIZED('Token已过期'));
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(errorHandler_1.Errors.UNAUTHORIZED('无效的Token'));
        }
        return next(errorHandler_1.Errors.UNAUTHORIZED('认证失败'));
    }
};
exports.authMiddleware = authMiddleware;
// 可选认证（用于某些公开接口）
const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return next();
    }
    const token = parts[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        req.user = decoded;
    }
    catch {
        // 可选认证失败不阻止请求
    }
    next();
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
//# sourceMappingURL=auth.js.map