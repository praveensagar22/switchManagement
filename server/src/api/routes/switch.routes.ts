import { Router } from 'express';
import { SwitchController } from '../controllers/switch.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createSwitchSchema, updateSwitchSchema, testConnectionSchema } from '../validators/switch.schema.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Read operations allowed for VIEWER, OPERATOR, ADMIN
router.get('/', authMiddleware, SwitchController.getAll);
router.get('/:id', authMiddleware, SwitchController.getById);

// Testing SNMP connection
router.post('/test-connection', authMiddleware, validate({ body: testConnectionSchema }), SwitchController.testConnection);

// Manual sync trigger
router.post('/:id/sync', authMiddleware, requireRole('ADMIN', 'OPERATOR'), SwitchController.sync);

// Mutation operations
router.post('/', authMiddleware, requireRole('ADMIN', 'OPERATOR'), validate({ body: createSwitchSchema }), SwitchController.create);
router.put('/:id', authMiddleware, requireRole('ADMIN', 'OPERATOR'), validate({ body: updateSwitchSchema }), SwitchController.update);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), SwitchController.delete);

export default router;
