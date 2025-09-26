import { Router } from 'express';
import { configController } from '../controllers';
import { isAuthenticated, hasPermission } from '../middleware';

const router = Router();

router.get('/permissions', configController.getPermissions);
router.put(
  '/permissions',
  isAuthenticated,
  hasPermission('canManageRoles'),
  configController.updatePermissions
);

router.get('/model', configController.getModelConfig);
router.put(
  '/model',
  isAuthenticated,
  hasPermission('canConfigureModel'),
  configController.updateModelConfig
);

router.get('/company', configController.getCompanyInfo);
router.put(
  '/company',
  isAuthenticated,
  hasPermission('canManageCompanyInfo'),
  configController.updateCompanyInfo
);

router.get(
  '/smtp',
  isAuthenticated,
  hasPermission('canConfigureSmtp'),
  configController.getSmtpConfig
);
router.put(
  '/smtp',
  isAuthenticated,
  hasPermission('canConfigureSmtp'),
  configController.updateSmtpConfig
);

router.get(
  '/api-key/status',
  isAuthenticated,
  hasPermission('canConfigureModel'),
  configController.getApiKeyStatus
);
router.post(
  '/api-key',
  isAuthenticated,
  hasPermission('canConfigureModel'),
  configController.updateApiKey
);

export default router;