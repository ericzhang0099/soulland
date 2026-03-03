"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthController_1 = require("../controllers/healthController");
const router = (0, express_1.Router)();
// GET /health - 健康检查
router.get('/', healthController_1.healthCheck);
// GET /health/ready - 就绪检查
router.get('/ready', healthController_1.readinessCheck);
exports.default = router;
//# sourceMappingURL=health.js.map