import { Router } from 'express';
import { usersController } from '../controllers';
import {
  isAuthenticated,
  hasPermission,
  isOwnerOrHasPermission,
  validate,
  validateQuery,
  userSchema,
  updateUserSchema,
  passwordUpdateSchema,
  paginationSchema
} from '../middleware';

const router = Router();

router.get(
  '/',
  isAuthenticated,
  hasPermission('canManageUsers'),
  validateQuery(paginationSchema),
  usersController.getUsers
);

router.post(
  '/',
  isAuthenticated,
  hasPermission('canManageUsers'),
  validate(userSchema),
  usersController.createUser
);

router.put(
  '/:username',
  isAuthenticated,
  isOwnerOrHasPermission('canManageUsers'),
  validate(updateUserSchema),
  usersController.updateUser
);

router.delete(
  '/:username',
  isAuthenticated,
  hasPermission('canManageUsers'),
  usersController.deleteUser
);

router.post(
  '/:username/reset-password',
  isAuthenticated,
  hasPermission('canManageUsers'),
  usersController.resetPassword
);

router.post(
  '/:username/reset-user-password',
  isAuthenticated,
  hasPermission('canManageUsers'),
  usersController.resetUserPassword
);

router.post(
  '/:username/resend-verification',
  isAuthenticated,
  hasPermission('canManageUsers'),
  usersController.resendVerificationEmail
);

router.post(
  '/update-password',
  isAuthenticated,
  validate(passwordUpdateSchema),
  usersController.updatePassword
);

export default router;