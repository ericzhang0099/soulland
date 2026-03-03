"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.logPerformance = exports.createRequestLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config");
const { combine, timestamp, json, printf, colorize, errors } = winston_1.default.format;
// 开发环境格式
const devFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    if (stack) {
        msg += `\n${stack}`;
    }
    return msg;
});
// 创建logger实例
exports.logger = winston_1.default.createLogger({
    level: config_1.config.logLevel,
    defaultMeta: {
        service: 'compute-gateway',
        environment: config_1.config.nodeEnv,
    },
    transports: [
        new winston_1.default.transports.Console({
            format: config_1.config.logFormat === 'json'
                ? combine(timestamp(), errors({ stack: true }), json())
                : combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), devFormat),
        }),
    ],
});
// 请求上下文logger
const createRequestLogger = (requestId) => {
    return exports.logger.child({ requestId });
};
exports.createRequestLogger = createRequestLogger;
// 性能日志
const logPerformance = (operation, durationMs, metadata) => {
    exports.logger.info({
        type: 'performance',
        operation,
        durationMs,
        ...metadata,
    });
};
exports.logPerformance = logPerformance;
// 错误日志
const logError = (error, context) => {
    exports.logger.error({
        type: 'error',
        message: error.message,
        stack: error.stack,
        ...context,
    });
};
exports.logError = logError;
//# sourceMappingURL=logger.js.map