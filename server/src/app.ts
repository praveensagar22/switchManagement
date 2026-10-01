import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRoutes from './api/routes/index.js';
import { errorHandler } from './api/middlewares/error.middleware.js';

export function createApp(): Application {
  const app = express();

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true
    })
  );

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger in development
  if (config.nodeEnv === 'development') {
    app.use((req, _res, next) => {
      console.log(`[HTTP] ${req.method} ${req.url}`);
      next();
    });
  }

  // Mount API v1 router
  app.use('/api/v1', apiRoutes);

  // Fallback 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Cannot ${req.method} ${req.originalUrl}`
    });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}
