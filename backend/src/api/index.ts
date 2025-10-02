import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import knowledgeRoutes from './knowledge.routes';
import logsRoutes from './logs.routes';
import configRoutes from './config.routes';
import chatRoutes from './chat.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/kb', knowledgeRoutes);
router.use('/logs', logsRoutes);
router.use('/config', configRoutes);
router.use('/chat', chatRoutes);

export default router;