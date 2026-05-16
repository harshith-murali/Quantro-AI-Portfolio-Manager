import { PrismaClient, Prisma } from '@prisma/client';
import { env } from '@/config/env';

declare global {
  // Prevent multiple Prisma instances in hot-reload (development)
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
