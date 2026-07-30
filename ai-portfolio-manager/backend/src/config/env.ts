import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('8080')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, { message: 'PORT must be a positive number' }),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ACCESS_TOKEN_SECRET: z
    .string()
    .min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  BCRYPT_ROUNDS: z
    .string()
    .default('12')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 10 && val <= 14, {
      message: 'BCRYPT_ROUNDS must be between 10 and 14',
    }),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET is required'),
  MARKET_DATA_MAX_STALENESS_DAYS: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'MARKET_DATA_MAX_STALENESS_DAYS must be a positive number',
    }),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('\n❌  Invalid environment configuration — server cannot start.\n');
  const formatted = result.error.format();
  console.error(JSON.stringify(formatted, null, 2));
  process.exit(1);
}

export const env = result.data;
export type Env = typeof env;
