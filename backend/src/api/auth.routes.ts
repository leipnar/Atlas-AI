import { Router } from 'express';
import { authController } from '../controllers';
import { isAuthenticated, validate, loginSchema } from '../middleware';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', isAuthenticated, authController.getCurrentUser);

// Passkey routes
router.post('/passkey/register-options', isAuthenticated, authController.generatePasskeyRegistrationOptions);
router.post('/passkey/register-verify', isAuthenticated, authController.verifyPasskeyRegistration);
router.post('/passkey/auth-options', authController.generatePasskeyAuthenticationOptions);
router.post('/passkey/auth-verify', authController.verifyPasskeyAuthentication);

export default router;