import { Router } from 'express';
import { logsController } from '../controllers';
import {
  isAuthenticated,
  hasPermission,
  validateQuery,
  paginationSchema
} from '../middleware';

const router = Router();

router.get(
  '/',
  isAuthenticated,
  hasPermission('canViewChatLogs'),
  validateQuery(paginationSchema),
  logsController.getConversations
);

router.get(
  '/:id',
  isAuthenticated,
  hasPermission('canViewChatLogs'),
  logsController.getConversation
);

export default router;