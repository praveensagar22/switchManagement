import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../core/errors/app.error.js';
import { config } from '../../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(config.nodeEnv === 'development' && { stack: err.stack })
    });
    return;
  }

  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
}
