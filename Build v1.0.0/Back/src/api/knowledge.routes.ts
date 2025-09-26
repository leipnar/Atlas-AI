import { Router } from 'express';
import { knowledgeController } from '../controllers';
import {
  isAuthenticated,
  hasPermission,
  validate,
  knowledgeEntrySchema
} from '../middleware';

const router = Router();

router.get('/', knowledgeController.getKnowledgeEntries);

router.post(
  '/',
  isAuthenticated,
  hasPermission('canManageKnowledgeBase'),
  validate(knowledgeEntrySchema),
  knowledgeController.createKnowledgeEntry
);

router.put(
  '/:id',
  isAuthenticated,
  hasPermission('canManageKnowledgeBase'),
  validate(knowledgeEntrySchema),
  knowledgeController.updateKnowledgeEntry
);

router.delete(
  '/:id',
  isAuthenticated,
  hasPermission('canManageKnowledgeBase'),
  knowledgeController.deleteKnowledgeEntry
);

export default router;