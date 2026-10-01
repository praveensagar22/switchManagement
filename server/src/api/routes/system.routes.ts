import { Router } from 'express';
import { SystemController } from '../controllers/system.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Public/Admin health check
router.get('/health', SystemController.getHealth);

// Seed default initial admin (only allowed when no users exist)
router.post('/seed-admin', SystemController.seedAdmin);

// Test email dispatch (Admin only)
router.post('/test-email', authMiddleware, requireRole('ADMIN'), SystemController.testEmail);

// Direct trap simulation trigger for interactive testing
router.post('/simulate-trap', authMiddleware, SystemController.simulateTrap);

export default router;
