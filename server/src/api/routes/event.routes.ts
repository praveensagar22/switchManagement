import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Query port event audit logs
router.get('/', authMiddleware, EventController.getAll);

export default router;
