import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const cacheClient = createClient({
  url: redisUrl
});

cacheClient.on('error', (err) => console.error('Redis Client Error', err));

export async function connectCache() {
  if (!cacheClient.isOpen) {
    await cacheClient.connect();
  }
}

export async function getCachedAvailability(key: string): Promise<any | null> {
  await connectCache();
  const data = await cacheClient.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCachedAvailability(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
  await connectCache();
  await cacheClient.setEx(key, ttlSeconds, JSON.stringify(value));
}
