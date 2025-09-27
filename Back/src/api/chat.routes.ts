import { Router } from 'express';
import { chatController, aiController } from '../controllers';
import { isAuthenticated, validate, feedbackSchema } from '../middleware';
import Joi from 'joi';

const messageSchema = Joi.object({
  message: Joi.string().required().max(5000),
  conversationId: Joi.string().optional()
});

const router = Router();

router.post(
  '/message',
  isAuthenticated,
  validate(messageSchema),
  aiController.sendMessage
);

router.post(
  '/feedback',
  isAuthenticated,
  validate(feedbackSchema),
  chatController.submitFeedback
);

export default router;