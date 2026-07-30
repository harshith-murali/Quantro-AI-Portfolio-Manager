import Redis from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: 'EX', seconds?: number): Promise<'OK'>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

class MemoryRedis implements CacheClient {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  private sweep(key: string): void {
    const item = this.store.get(key);
    if (item?.expiresAt !== null && item?.expiresAt !== undefined && item.expiresAt <= Date.now()) {
      this.store.delete(key);
    }
  }

  async get(key: string): Promise<string | null> {
    this.sweep(key);
    return this.store.get(key)?.value ?? null;
  }

  async set(key: string, value: string, mode?: 'EX', seconds?: number): Promise<'OK'> {
    const expiresAt = mode === 'EX' && seconds ? Date.now() + seconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count += 1;
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
    return Array.from(this.store.keys()).filter((key) => {
      this.sweep(key);
      return regex.test(key);
    });
  }

  async incr(key: string): Promise<number> {
    const current = parseInt((await this.get(key)) ?? '0', 10) + 1;
    this.store.set(key, { value: current.toString(), expiresAt: this.store.get(key)?.expiresAt ?? null });
    return current;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }
}

class RedisWrapper implements CacheClient {
  constructor(private readonly client: Redis) {}

  get(key: string) { return this.client.get(key); }
  set(key: string, value: string, mode?: 'EX', seconds?: number) {
    return mode === 'EX' && seconds
      ? this.client.set(key, value, 'EX', seconds)
      : this.client.set(key, value);
  }
  del(...keys: string[]) { return this.client.del(...keys); }
  incr(key: string) { return this.client.incr(key); }
  expire(key: string, seconds: number) { return this.client.expire(key, seconds); }

  async keys(pattern: string): Promise<string[]> {
    const matches: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, batch] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      matches.push(...batch);
    } while (cursor !== '0');
    return matches;
  }
}

function createRedisClient(): CacheClient {
  if (process.env.REDIS_URL || env.REDIS_HOST) {
    const client = process.env.REDIS_URL
      ? new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
      : new Redis({
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD,
          tls: env.REDIS_TLS ? {} : undefined,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });

    client.connect().catch((error) => {
      logger.warn('Redis unavailable; cache operations may fail until it reconnects', { error });
    });
    logger.info('Redis client configured');
    return new RedisWrapper(client);
  }

  logger.info('Redis config not provided; using TTL-aware in-memory cache');
  return new MemoryRedis();
}

const redis = createRedisClient();
export default redis;
