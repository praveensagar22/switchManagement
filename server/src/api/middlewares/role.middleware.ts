import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../core/types/user.types.js';
import { ForbiddenError, UnauthorizedError } from '../../core/errors/app.error.js';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User is not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Role '${req.user.role}' is not authorized. Required: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
}
