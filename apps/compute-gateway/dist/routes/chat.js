"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const chatValidator_1 = require("../validators/chatValidator");
const router = (0, express_1.Router)();
// POST /v1/chat/completions - OpenAI兼容的聊天完成接口
router.post('/completions', chatValidator_1.validateChatRequest, chatController_1.chatCompletions);
exports.default = router;
//# sourceMappingURL=chat.js.map