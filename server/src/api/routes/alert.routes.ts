import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Get active alerts
router.get('/active', authMiddleware, AlertController.getActive);

// Get historical alerts
router.get('/history', authMiddleware, AlertController.getHistory);

// Acknowledge an active alert
router.patch('/:id/acknowledge', authMiddleware, requireRole('ADMIN', 'OPERATOR'), AlertController.acknowledge);

export default router;
