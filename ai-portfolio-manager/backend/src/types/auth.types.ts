/**
 * Core type definitions for the Quantro auth system.
 */

import { Role } from '@prisma/client';

// ─── JWT ──────────────────────────────────────────────────────────

export interface JwtPayload {
  /** User's DB primary key */
  userId: string;
  /** User role for RBAC */
  role: Role;
  /**
   * Snapshot of User.tokenVersion at signing time.
   * Refresh token validation checks this against the DB value —
   * incrementing the DB value on logout invalidates all sessions.
   */
  tokenVersion: number;
  /** Distinguishes access vs refresh tokens to prevent cross-use */
  type: 'access' | 'refresh';
  /** Issued-at (set by jsonwebtoken) */
  iat?: number;
  /** Expiry (set by jsonwebtoken) */
  exp?: number;
}

// ─── Auth responses ───────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tokenVersion: number;
  createdAt: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<AuthUser, 'tokenVersion'>;
  accessToken: string;
}

// ─── Service inputs ───────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
