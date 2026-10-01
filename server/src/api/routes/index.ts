import { Router } from 'express';
import authRoutes from './auth.routes.js';
import switchRoutes from './switch.routes.js';
import interfaceRoutes from './interface.routes.js';
import eventRoutes from './event.routes.js';
import alertRoutes from './alert.routes.js';
import systemRoutes from './system.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/switches', switchRoutes);
router.use('/interfaces', interfaceRoutes);
router.use('/events', eventRoutes);
router.use('/alerts', alertRoutes);
router.use('/system', systemRoutes);

export default router;
