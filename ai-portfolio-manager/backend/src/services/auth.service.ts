import prisma from '@/config/db';
import crypto from 'crypto';
import { hashPassword, comparePassword } from '@/utils/hash';
import { generateTokenPair, verifyRefreshToken } from '@/utils/jwt';
import {
  createRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  validateRefreshTokenRecord,
  cleanupUserTokens,
} from '@/services/token.service';
import { AppError, AuthError, ConflictError } from '@/utils/AppError';
import { authLogger, logger } from '@/utils/logger';
import { env } from '@/config/env';
import { sendVerificationOtp } from '@/services/email.service';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '@/validators/auth.validator';
import type {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendVerificationInput,
} from '@/validators/auth.validator';
import type { AuthUser } from '@/types/auth.types';

function generateOtp(): string {
  return crypto.randomInt(100000, 1_000_000).toString();
}

function hashOtp(email: string, otp: string): string {
  return crypto
    .createHmac('sha256', env.REFRESH_TOKEN_SECRET)
    .update(`${email}:${otp}`)
    .digest('hex');
}

function otpMatches(email: string, otp: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashOtp(email, otp), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

async function createAndSendVerificationOtp(user: { id: string; email: string; name: string }): Promise<void> {
  if (!env.EMAIL_VERIFICATION_ENABLED) return;

  const otp = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: false,
      emailOtpHash: hashOtp(user.email, otp),
      emailOtpExpiresAt: new Date(Date.now() + env.EMAIL_OTP_EXPIRY_MINUTES * 60 * 1000),
      emailOtpLastSentAt: new Date(),
    },
  });

  await sendVerificationOtp(user.email, user.name, otp);
}

async function cleanupFailedRegistration(userId: string): Promise<void> {
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    logger.warn('Failed to clean up user after registration email failure', { userId, error });
  }
}

// ─── Register ─────────────────────────────────────────────────────

export async function register(
  input: RegisterInput,
  ip: string,
): Promise<{ user: Omit<AuthUser, 'tokenVersion'>; accessToken: string; emailVerificationRequired: boolean }> {
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
      emailVerified: !env.EMAIL_VERIFICATION_ENABLED,
      hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      tokenVersion: true,
      createdAt: true,
    },
  });

  const tokens = generateTokenPair(user.id, user.role, user.tokenVersion);
  await createRefreshToken(user.id, tokens.refreshToken);
  try {
    await createAndSendVerificationOtp(user);
  } catch (error) {
    await cleanupFailedRegistration(user.id);
    throw error;
  }

  authLogger.register(user.email, user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
    accessToken: tokens.accessToken,
    emailVerificationRequired: env.EMAIL_VERIFICATION_ENABLED && !user.emailVerified,
    // refreshToken is set as HttpOnly cookie in the controller
  };
}

export async function registerGetRefreshToken(
  input: RegisterInput,
  ip: string,
): Promise<{
  user: Omit<AuthUser, 'tokenVersion'>;
  accessToken: string;
  refreshToken: string;
  emailVerificationRequired: boolean;
}> {
  const data = registerSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      emailVerified: !env.EMAIL_VERIFICATION_ENABLED,
      hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      tokenVersion: true,
      createdAt: true,
    },
  });

  const tokens = generateTokenPair(user.id, user.role, user.tokenVersion);
  await createRefreshToken(user.id, tokens.refreshToken);
  try {
    await createAndSendVerificationOtp(user);
  } catch (error) {
    await cleanupFailedRegistration(user.id);
    throw error;
  }

  authLogger.register(user.email, user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    emailVerificationRequired: env.EMAIL_VERIFICATION_ENABLED && !user.emailVerified,
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
      emailVerified: true,
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

  if (env.EMAIL_VERIFICATION_ENABLED && !user.emailVerified) {
    throw new AuthError('Please verify your email before signing in');
  }

  // Cleanup stale tokens before creating a new one
  await cleanupUserTokens(user.id);

  const tokens = generateTokenPair(user.id, user.role, user.tokenVersion);
  await createRefreshToken(user.id, tokens.refreshToken);

  authLogger.login(user.email, user.id, ip);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// ─── Email verification ──────────────────────────────────────────

export async function verifyEmail(input: VerifyEmailInput): Promise<{ verified: boolean }> {
  const data = verifyEmailSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      emailOtpHash: true,
      emailOtpExpiresAt: true,
    },
  });

  if (!user) {
    throw new AuthError('Invalid or expired verification code');
  }

  if (user.emailVerified) {
    return { verified: true };
  }

  if (!user.emailOtpHash || !user.emailOtpExpiresAt || user.emailOtpExpiresAt <= new Date()) {
    throw new AuthError('Invalid or expired verification code');
  }

  if (!otpMatches(user.email, data.otp, user.emailOtpHash)) {
    throw new AuthError('Invalid or expired verification code');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailOtpHash: null,
      emailOtpExpiresAt: null,
      emailOtpLastSentAt: null,
    },
  });

  return { verified: true };
}

export async function resendVerification(input: ResendVerificationInput): Promise<{ sent: boolean }> {
  const data = resendVerificationSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      emailOtpLastSentAt: true,
    },
  });

  if (!user || user.emailVerified) {
    return { sent: true };
  }

  if (user.emailOtpLastSentAt) {
    const elapsedMs = Date.now() - user.emailOtpLastSentAt.getTime();
    const cooldownMs = env.EMAIL_OTP_RESEND_COOLDOWN_SECONDS * 1000;
    if (elapsedMs < cooldownMs) {
      throw new AppError('Please wait before requesting another code', 429);
    }
  }

  await createAndSendVerificationOtp(user);
  return { sent: true };
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

  // 2. Validate DB record (not revoked, not expired, tokenVersion match)
  await validateRefreshTokenRecord(rawRefreshToken, payload.tokenVersion);

  // 3. Rotate: revoke old token, issue new pair
  await revokeRefreshToken(rawRefreshToken);

  // Fetch fresh user data for the new token
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: payload.userId },
    select: { id: true, role: true, tokenVersion: true },
  });

  const tokens = generateTokenPair(user.id, user.role, user.tokenVersion);
  await createRefreshToken(user.id, tokens.refreshToken);

  authLogger.tokenRefreshed(user.id);

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
      emailVerified: true,
      createdAt: true,
    },
  });

  return user;
}
