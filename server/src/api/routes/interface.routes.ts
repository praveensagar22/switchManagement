import { Router } from 'express';
import { InterfaceController } from '../controllers/interface.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Get interfaces for a specific switch
router.get('/switch/:switchId', authMiddleware, InterfaceController.getBySwitch);

// Get single interface
router.get('/:id', authMiddleware, InterfaceController.getById);

// Get history of state changes for an interface
router.get('/:id/history', authMiddleware, InterfaceController.getHistory);

export default router;
