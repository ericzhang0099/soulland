"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const container_1 = require("./services/container");
const compute_routes_1 = require("./routes/compute.routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
// 中间件
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 初始化依赖
const container = (0, container_1.createContainer)();
// 注册供应商
(0, container_1.registerProviders)(container.router);
// 启动健康检查
container.router.startHealthChecks(30000);
// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        providers: container.router.getProviderStatus(),
    });
});
// API路由
app.use('/v1', (0, compute_routes_1.createComputeRoutes)(container.computeService));
// 管理API
app.get('/admin/providers', (req, res) => {
    res.json(container.router.getProviderStatus());
});
// 404处理
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
// 错误处理
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// 启动服务器
app.listen(PORT, () => {
    console.log(`GenLoop Compute Gateway running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Registered providers:`, Array.from(container.router.getAdapters().keys()));
});
// 优雅关闭
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await container.router.close();
    await container.quotaService.close();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await container.router.close();
    await container.quotaService.close();
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=app.js.map