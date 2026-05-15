import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { env } from '@/config/env';

const { combine, timestamp, colorize, printf, json, errors, label } = winston.format;

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ─── Formatters ───────────────────────────────────────────────────

const devConsoleFormat = combine(
  colorize({ all: true }),
  label({ label: 'FinTech' }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, label: lbl, stack, ...meta }) => {
    let log = `${timestamp} [${lbl}] ${level}: ${message}`;
    if (stack) log += `\n${String(stack)}`;
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) log += `\n${JSON.stringify(meta, null, 2)}`;
    return log;
  }),
);

const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

// ─── Transports ───────────────────────────────────────────────────

const transports: winston.transport[] = [
  // Error-only file (all environments)
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5 * 1024 * 1024,   // 5 MB
    maxFiles: 5,
    tailable: true,
  }),
  // Combined file (all environments)
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 10 * 1024 * 1024,  // 10 MB
    maxFiles: 10,
    tailable: true,
  }),
];

// Console transport
transports.push(
  new winston.transports.Console({
    format: env.NODE_ENV === 'production' ? fileFormat : devConsoleFormat,
  }),
);

// ─── Logger ───────────────────────────────────────────────────────

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'warn' : 'debug',
  transports,
  exitOnError: false,
});

/**
 * Typed log helpers for auth-specific events.
 */
export const authLogger = {
  register: (email: string, userId: string) =>
    logger.info('User registered', { event: 'auth.register', email, userId }),

  login: (email: string, userId: string, ip: string) =>
    logger.info('User logged in', { event: 'auth.login', email, userId, ip }),

  loginFailed: (email: string, ip: string, reason: string) =>
    logger.warn('Failed login attempt', { event: 'auth.login.failed', email, ip, reason }),

  logout: (userId: string) =>
    logger.info('User logged out', { event: 'auth.logout', userId }),

  tokenRefreshed: (userId: string) =>
    logger.info('Tokens refreshed', { event: 'auth.token.refresh', userId }),

  tokenInvalid: (reason: string, ip: string) =>
    logger.warn('Invalid token presented', { event: 'auth.token.invalid', reason, ip }),
};
