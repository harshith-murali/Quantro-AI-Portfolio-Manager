// Load and validate environment first — will exit(1) on bad config
import '@/config/env';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { requestLogger } from '@/middlewares/requestLogger';
import { errorHandler } from '@/middlewares/errorHandler';
import { generalRateLimiter } from '@/middlewares/rateLimiter';
import apiRouter from '@/routes/index';
import prisma from '@/config/db';

// ─── App factory ──────────────────────────────────────────────────

function createApp(): express.Application {
  const app = express();

  // ── Security headers ────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy: origin ${origin} is not allowed`));
        }
      },
      credentials: true,           // Required for HttpOnly cookies
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Body parsing ────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // ── Trust proxy (for accurate req.ip behind load balancer) ──────
  app.set('trust proxy', 1);

  // ── Request logging ─────────────────────────────────────────────
  app.use(requestLogger);

  // ── General rate limiting ───────────────────────────────────────
  app.use('/api', generalRateLimiter);

  // ── API routes ──────────────────────────────────────────────────
  app.use('/api', apiRouter);

  // ── 404 handler ─────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.originalUrl} not found`,
    });
  });

  // ── Centralised error handler (must be last) ─────────────────────
  app.use(errorHandler);

  return app;
}

// ─── Bootstrap ────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  const app = createApp();

  // Verify database connectivity before accepting traffic
  try {
    await prisma.$connect();
    logger.info('✅  Database connected');
  } catch (error) {
    logger.error('❌  Failed to connect to database', { error });
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀  FinTech API running`, {
      port: env.PORT,
      environment: env.NODE_ENV,
      url: `http://localhost:${env.PORT}/api`,
    });
  });

  // ── Graceful shutdown ──────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('💤  Server closed and DB disconnected');
      process.exit(0);
    });

    // Force shutdown after 10s if graceful close hangs
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ── Unhandled rejections ───────────────────────────────────────
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason });
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error });
    process.exit(1);
  });
}

bootstrap();
