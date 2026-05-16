import { createClient } from 'redis';

export const redis = createClient({
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
});

redis.on('error', (err) => console.error('[redis] error', err));

export const STREAM_EVENTS = 'nexus:events';
export const STREAM_SIGNALS = 'nexus:signals';

export async function connectRedis() {
  await redis.connect();
  console.log('[redis] connected');
}

export async function publishToStream(
  stream: string,
  fields: Record<string, string>
): Promise<void> {
  await redis.xAdd(stream, '*', fields);
}
