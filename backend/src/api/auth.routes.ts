import { Router } from 'express';
import { authController } from '../controllers';
import { isAuthenticated, validate, loginSchema } from '../middleware';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', isAuthenticated, authController.getCurrentUser);

// Passkey routes (simulated)
router.post('/passkey/register', authController.registerPasskey);
router.post('/passkey/login', authController.loginWithPasskey);

export default router;