import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import os from 'os';

// Singleton Redis client for system metrics — reuses the same connection across requests
let _metricsRedis: Redis | null = null;
function getMetricsRedis(): Redis {
  if (_metricsRedis) return _metricsRedis;
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  _metricsRedis = new Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
  return _metricsRedis;
}

export async function getSystemMetrics() {
  const connection = getMetricsRedis();
  const queue = new Queue('events', { connection: connection as any });

  // Run DB size query and Redis info/queue counts in parallel
  const [dbResult, queueCountsResult, redisInfoResult] = await Promise.allSettled([
    db.execute(sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`),
    queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'prioritized'),
    connection.info('memory'),
  ]);

  await queue.close(); // close queue handle, not the connection

  const dbSize = dbResult.status === 'fulfilled'
    ? (dbResult.value.rows[0] as any)?.size ?? 'Unknown'
    : 'Unknown';

  const queueCounts = queueCountsResult.status === 'fulfilled'
    ? queueCountsResult.value as any
    : { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, prioritized: 0 };

  let redisMemory = 'Unknown';
  if (redisInfoResult.status === 'fulfilled') {
    const match = redisInfoResult.value.match(/used_memory_human:([^\r\n]+)/);
    if (match) redisMemory = match[1];
  }

  // OS metrics are synchronous — no await needed
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    dbSize,
    os: {
      totalMem,
      usedMem,
      memUsagePercent: Math.round((usedMem / totalMem) * 100),
      uptime: os.uptime(),
      cpus: os.cpus().length,
      loadavg: os.loadavg(),
      arch: os.arch(),
      platform: os.platform(),
      release: os.release(),
    },
    redis: {
      memory: redisMemory,
      queueCounts,
    },
  };
}

