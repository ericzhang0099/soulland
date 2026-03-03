"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsageStats = exports.getUsage = void 0;
const usageService_1 = require("../services/usageService");
const logger_1 = require("../utils/logger");
const getUsage = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate, model, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const usage = await usageService_1.usageService.getUsageRecords({
            userId,
            startDate: startDate,
            endDate: endDate,
            model: model,
            page: pageNum,
            limit: limitNum,
        });
        logger_1.logger.info({
            action: 'get_usage',
            userId,
            recordCount: usage.records.length,
        });
        res.json({
            success: true,
            data: usage,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsage = getUsage;
const getUsageStats = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { period = '7d' } = req.query;
        const stats = await usageService_1.usageService.getUsageStats({
            userId,
            period: period,
        });
        logger_1.logger.info({
            action: 'get_usage_stats',
            userId,
            period,
        });
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsageStats = getUsageStats;
//# sourceMappingURL=usageController.js.map