import { createClient, type RedisClientType } from 'redis';

export const redis: RedisClientType = createClient({
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
});

redis.on('error', (err) => console.error('[redis] error', err));

export const STREAM_EVENTS = 'nexus:events';
export const STREAM_SIGNALS = 'nexus:signals';

let _redisAvailable = false;

export async function connectRedis() {
  try {
    await redis.connect();
    _redisAvailable = true;
    console.log('[redis] connected');
  } catch (err) {
    console.error('[redis] connection failed — SSE streams and signal publishing will be unavailable. Fix REDIS_URL to restore full functionality.', err);
  }
}

export async function publishToStream(
  stream: string,
  fields: Record<string, string>
): Promise<void> {
  if (!_redisAvailable) return;
  try {
    await redis.xAdd(stream, '*', fields);
  } catch (err) {
    console.error('[redis] publishToStream failed:', err);
  }
}
