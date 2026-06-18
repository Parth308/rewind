import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedisClient() {
  if (redis) return redis;
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
  return redis;
}

/**
 * Cache wrapper for expensive DB queries.
 * @param key Unique string identifier for the query and its parameters
 * @param ttlSeconds Time to live in seconds
 * @param fetcher Function that returns the promise of data to be cached
 * @returns Parsed JSON data
 */
export async function withRedisCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // If TTL is 0 or negative, bypass cache completely
  if (ttlSeconds <= 0) {
    return fetcher();
  }

  const client = getRedisClient();

  try {
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (e) {
    console.error('Redis cache get error:', e);
  }

  // Execute the expensive query
  const data = await fetcher();

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (e) {
    console.error('Redis cache set error:', e);
  }

  return data;
}
