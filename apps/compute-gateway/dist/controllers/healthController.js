"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readinessCheck = exports.healthCheck = void 0;
const config_1 = require("../config");
const providerRouter_1 = require("../services/providerRouter");
const rateLimit_1 = require("../middleware/rateLimit");
const logger_1 = require("../utils/logger");
const healthCheck = (req, res) => {
    res.json({
        status: 'healthy',
        service: 'compute-gateway',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        environment: config_1.config.nodeEnv,
    });
};
exports.healthCheck = healthCheck;
const readinessCheck = async (req, res) => {
    const checks = {};
    let isReady = true;
    // 检查Redis连接
    try {
        if (rateLimit_1.redisClient.status === 'ready') {
            checks.redis = { status: 'ok' };
        }
        else {
            checks.redis = { status: 'error', message: 'Redis未连接' };
            isReady = false;
        }
    }
    catch (error) {
        checks.redis = {
            status: 'error',
            message: error instanceof Error ? error.message : 'Redis检查失败'
        };
        isReady = false;
    }
    // 检查供应商状态
    const availableProviders = providerRouter_1.providerRouter.getAvailableProviders();
    if (availableProviders.length > 0) {
        checks.providers = {
            status: 'ok',
            message: `${availableProviders.length}个供应商可用`
        };
    }
    else {
        checks.providers = {
            status: 'error',
            message: '没有可用的供应商'
        };
        isReady = false;
    }
    // 检查AGC服务连接
    try {
        // 这里可以添加AGC服务的健康检查
        checks.agc = { status: 'ok' };
    }
    catch (error) {
        checks.agc = {
            status: 'error',
            message: error instanceof Error ? error.message : 'AGC服务检查失败'
        };
        // AGC服务不可用不影响网关就绪状态
    }
    const statusCode = isReady ? 200 : 503;
    if (!isReady) {
        logger_1.logger.warn({
            action: 'readiness_check_failed',
            checks,
        });
    }
    res.status(statusCode).json({
        ready: isReady,
        checks,
        timestamp: new Date().toISOString(),
    });
};
exports.readinessCheck = readinessCheck;
//# sourceMappingURL=healthController.js.map