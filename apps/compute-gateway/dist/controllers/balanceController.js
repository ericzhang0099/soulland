"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalance = void 0;
const agcService_1 = require("../services/agcService");
const logger_1 = require("../utils/logger");
const getBalance = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const balance = await agcService_1.agcService.getBalance(userId);
        const holdAmount = await agcService_1.agcService.getHoldAmount(userId);
        logger_1.logger.info({
            action: 'get_balance',
            userId,
            balance,
            holdAmount,
        });
        res.json({
            success: true,
            data: {
                userId,
                balance,
                holdAmount,
                availableBalance: balance - holdAmount,
                currency: 'AGC',
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBalance = getBalance;
//# sourceMappingURL=balanceController.js.map