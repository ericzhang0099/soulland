import { Router } from 'express';
import { chatCompletions } from '../controllers/chatController';
import { validateChatRequest } from '../validators/chatValidator';

const router = Router();

// POST /v1/chat/completions - OpenAI兼容的聊天完成接口
router.post('/completions', validateChatRequest, chatCompletions);

export default router;