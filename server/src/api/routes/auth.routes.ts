import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginSchema, registerSchema } from '../validators/auth.schema.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', validate({ body: loginSchema }), AuthController.login);
router.post('/register', validate({ body: registerSchema }), AuthController.register);
router.get('/me', authMiddleware, AuthController.getMe);

export default router;
