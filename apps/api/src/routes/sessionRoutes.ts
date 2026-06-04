import { Router } from 'express';
import { getSession, getSessionEvents } from '../controllers/sessionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/:sessionId', getSession);
router.get('/:sessionId/events', getSessionEvents);

export default router;
