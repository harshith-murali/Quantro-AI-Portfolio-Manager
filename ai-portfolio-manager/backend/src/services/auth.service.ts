import prisma from '@/config/db';
import { hashPassword, comparePassword, hashToken } from '@/utils/hash';
import { generateTokenPair, verifyRefreshToken } from '@/utils/jwt';
import {
  createRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  validateRefreshTokenRecord,
  cleanupUserTokens,
} from '@/services/token.service';
import { AuthError, ConflictError } from '@/utils/AppError';
import { authLogger } from '@/utils/logger';
import { registerSchema, loginSchema } from '@/validators/auth.validator';
import type { RegisterInput, LoginInput } from '@/validators/auth.validator';
import type { AuthResponse, AuthUser } from '@/types/auth.types';

// ─── Register ─────────────────────────────────────────────────────

export async function register(
  input: RegisterInput,
  ip: string,
): Promise<{ user: Omit<AuthUser, 'tokenVersion'>; accessToken: string }> {
  // Validate input
  const data = registerSchema.parse(input);

  // Duplicate email check
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tokenVersion: true,
      createdAt: true,
    },
  });

  const tokens = generateTokenPair(user.id, user.role, user.tokenVersion);
  await createRefreshToken(user.id, tokens.refreshToken);

  authLogger.register(user.email, user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    accessToken: tokens.accessToken,
    // refreshToken is set as HttpOnly cookie in the controller
  };
}

export async function registerGetRefreshToken(
  input: RegisterInput,
  ip: string,
): Promise<{ user: Omit<AuthUser, 'tokenVersion'>; accessToken: string; refreshToken: string }> {
  const data = registerSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, hashedPassword },
    select: { id: true, name: true, email: true, role: true, tokenVersion: true, createdAt: true },
  });

  const tokens = generateTokenPair(user.id, user.role, user.tokenVersion);
  await createRefreshToken(user.id, tokens.refreshToken);

  authLogger.register(user.email, user.id);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// ─── Login ────────────────────────────────────────────────────────

export async function login(
  input: LoginInput,
  ip: string,
): Promise<{ user: Omit<AuthUser, 'tokenVersion'>; accessToken: string; refreshToken: string }> {
  const data = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hashedPassword: true,
      tokenVersion: true,
      createdAt: true,
    },
  });

  // Use the same error message for missing user and wrong password
  // to prevent email enumeration attacks
  if (!user) {
    authLogger.loginFailed(data.email, ip, 'user not found');
    throw new AuthError('Invalid email or password');
  }

  const passwordValid = await comparePassword(data.password, user.hashedPassword);
  if (!passwordValid) {
    authLogger.loginFailed(data.email, ip, 'wrong password');
    throw new AuthError('Invalid email or password');
  }

  // Cleanup stale tokens before creating a new one
  await cleanupUserTokens(user.id);

  const tokens = generateTokenPair(user.id, user.role, user.tokenVersion);
  await createRefreshToken(user.id, tokens.refreshToken);

  authLogger.login(user.email, user.id, ip);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// ─── Logout ───────────────────────────────────────────────────────

export async function logout(userId: string, rawRefreshToken?: string): Promise<void> {
  // Revoke the specific refresh token if provided
  if (rawRefreshToken) {
    await revokeRefreshToken(rawRefreshToken);
  }

  // Increment tokenVersion — invalidates ALL outstanding access tokens
  // (they'll fail the tokenVersion check in verifyAccessToken middleware)
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });

  authLogger.logout(userId);
}

// ─── Refresh ──────────────────────────────────────────────────────

export async function refresh(
  rawRefreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  // 1. Verify JWT signature and expiry
  const payload = verifyRefreshToken(rawRefreshToken);

  // Consume and replace the stored token atomically. UUID IDs keep concurrent
  // logins distinct; the conditional update makes refresh tokens single-use.
  await validateRefreshTokenRecord(rawRefreshToken, payload.tokenVersion);
  const tokens = await prisma.$transaction(async tx => {
    const consumed = await tx.refreshToken.updateMany({ where: { token: hashToken(rawRefreshToken), revoked: false, expiresAt: { gt: new Date() } }, data: { revoked: true } });
    if (consumed.count !== 1) throw new AuthError('Refresh token has already been used.');
    const user = await tx.user.findUniqueOrThrow({ where: { id: payload.userId }, select: { id: true, role: true, tokenVersion: true } });
    if (user.tokenVersion !== payload.tokenVersion) throw new AuthError('Session invalidated.');
    const next = generateTokenPair(user.id, user.role, user.tokenVersion);
    const nextPayload = verifyRefreshToken(next.refreshToken);
    await tx.refreshToken.create({ data: { userId: user.id, token: hashToken(next.refreshToken), expiresAt: new Date(nextPayload.exp! * 1000) } });
    return next;
  });
  authLogger.tokenRefreshed(payload.userId);
  return tokens;
}

// ─── Get Me ───────────────────────────────────────────────────────

export async function getMe(userId: string): Promise<Omit<AuthUser, 'tokenVersion'>> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}
