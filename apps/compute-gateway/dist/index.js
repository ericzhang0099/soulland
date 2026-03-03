"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
const rateLimit_1 = require("./middleware/rateLimit");
const logger_1 = require("./utils/logger");
const config_1 = require("./config");
const chat_1 = __importDefault(require("./routes/chat"));
const usage_1 = __importDefault(require("./routes/usage"));
const balance_1 = __importDefault(require("./routes/balance"));
const health_1 = __importDefault(require("./routes/health"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// 安全中间件
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.corsOrigins,
    credentials: true
}));
// 日志中间件
app.use((0, morgan_1.default)(config_1.config.logFormat === 'json' ? 'combined' : 'dev', {
    stream: {
        write: (message) => logger_1.logger.info(message.trim())
    }
}));
// 解析中间件
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// 健康检查（不需要认证）
app.use('/health', health_1.default);
// API速率限制
app.use(rateLimit_1.rateLimitMiddleware);
// 认证中间件
app.use(auth_1.authMiddleware);
// API路由
app.use('/v1/chat', chat_1.default);
app.use('/v1/usage', usage_1.default);
app.use('/v1/balance', balance_1.default);
// 错误处理中间件
app.use(errorHandler_1.errorHandler);
// 启动服务器
const PORT = config_1.config.port;
app.listen(PORT, () => {
    logger_1.logger.info(`算力网关服务已启动`);
    logger_1.logger.info(`环境: ${config_1.config.nodeEnv}`);
    logger_1.logger.info(`端口: ${PORT}`);
    logger_1.logger.info(`可用供应商: ${config_1.config.providers.filter(p => p.enabled).map(p => p.name).join(', ')}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map