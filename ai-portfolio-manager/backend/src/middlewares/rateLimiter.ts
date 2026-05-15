import rateLimit from 'express-rate-limit';
import { errorResponse } from '@/utils/ApiResponse';

/**
 * Strict rate limiter for authentication endpoints.
 * 10 requests per 15 minutes per IP.
 * This slows brute-force and credential stuffing attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,
  standardHeaders: 'draft-7',  // RateLimit-Policy header
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json(
      errorResponse(
        'Too many requests from this IP. Please try again after 15 minutes.',
      ),
    );
  },
  keyGenerator: (req) => req.ip ?? 'unknown',
});

/**
 * More lenient limiter for general API routes.
 * 100 requests per minute per IP.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,         // 1 minute
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(
      errorResponse('Rate limit exceeded. Please slow down.'),
    );
  },
  keyGenerator: (req) => req.ip ?? 'unknown',
});
