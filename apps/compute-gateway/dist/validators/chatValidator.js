"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChatRequest = void 0;
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
exports.validateChatRequest = [
    (0, express_validator_1.body)('model')
        .notEmpty()
        .withMessage('model是必填字段')
        .isString()
        .withMessage('model必须是字符串'),
    (0, express_validator_1.body)('messages')
        .notEmpty()
        .withMessage('messages是必填字段')
        .isArray({ min: 1 })
        .withMessage('messages必须是非空数组'),
    (0, express_validator_1.body)('messages.*.role')
        .notEmpty()
        .withMessage('message.role是必填字段')
        .isIn(['system', 'user', 'assistant', 'function', 'tool'])
        .withMessage('message.role必须是system, user, assistant, function或tool'),
    (0, express_validator_1.body)('messages.*.content')
        .optional()
        .isString()
        .withMessage('message.content必须是字符串'),
    (0, express_validator_1.body)('temperature')
        .optional()
        .isFloat({ min: 0, max: 2 })
        .withMessage('temperature必须在0-2之间'),
    (0, express_validator_1.body)('max_tokens')
        .optional()
        .isInt({ min: 1, max: 8192 })
        .withMessage('max_tokens必须是1-8192之间的整数'),
    (0, express_validator_1.body)('stream')
        .optional()
        .isBoolean()
        .withMessage('stream必须是布尔值'),
    (0, express_validator_1.body)('top_p')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('top_p必须在0-1之间'),
    (0, express_validator_1.body)('presence_penalty')
        .optional()
        .isFloat({ min: -2, max: 2 })
        .withMessage('presence_penalty必须在-2到2之间'),
    (0, express_validator_1.body)('frequency_penalty')
        .optional()
        .isFloat({ min: -2, max: 2 })
        .withMessage('frequency_penalty必须在-2到2之间'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(e => `${e.path}: ${e.msg}`).join(', ');
            return next(errorHandler_1.Errors.BAD_REQUEST(`参数验证失败: ${errorMessages}`));
        }
        next();
    },
];
//# sourceMappingURL=chatValidator.js.map