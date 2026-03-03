"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usageController_1 = require("../controllers/usageController");
const router = (0, express_1.Router)();
// GET /v1/usage - 获取用量记录
router.get('/', usageController_1.getUsage);
// GET /v1/usage/stats - 获取用量统计
router.get('/stats', usageController_1.getUsageStats);
exports.default = router;
//# sourceMappingURL=usage.js.map