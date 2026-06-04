import { Router } from 'express';
import { getProjects, createProject, getProjectSessions } from '../controllers/projectController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:projectId/sessions', getProjectSessions);

export default router;
