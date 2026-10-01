import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../security/jwt.js';
import { UnauthorizedError } from '../../core/errors/app.error.js';
import { AuthUserPayload } from '../../core/types/user.types.js';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing or invalid');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    throw new UnauthorizedError('Token is invalid or has expired');
  }
}
