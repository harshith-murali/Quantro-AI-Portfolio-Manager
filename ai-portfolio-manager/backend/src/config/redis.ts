import { logger } from '@/utils/logger';

class MockRedis {
  private store = new Map<string, string>();

  async get(key: string) { return this.store.get(key) || null; }
  async set(key: string, value: string, ...args: any[]) { 
    this.store.set(key, value); 
    return 'OK'; 
  }
  async del(...keys: string[]) {
    let count = 0;
    for (const k of keys) { if (this.store.delete(k)) count++; }
    return count;
  }
  async keys(pattern: string) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter(k => regex.test(k));
  }
  async incr(key: string) {
    const val = parseInt(this.store.get(key) || '0', 10) + 1;
    this.store.set(key, val.toString());
    return val;
  }
  async expire(key: string, seconds: number) { return 1; }
  on(event: string, callback: any) {
    if (event === 'connect') setTimeout(callback, 0);
  }
}

const redis = new MockRedis() as any;
logger.info('✅  Mock Redis initialized (In-Memory fallback)');

export default redis;
