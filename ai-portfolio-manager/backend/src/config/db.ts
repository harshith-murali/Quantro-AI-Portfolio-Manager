import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '@/config/env';

declare global {
  // Prevent multiple Prisma instances in hot-reload (development)
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const isRds = process.env.DATABASE_URL?.includes('rds.amazonaws.com') || process.env.DATABASE_URL?.includes('sslmode=');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRds ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);

const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
