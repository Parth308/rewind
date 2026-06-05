import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import os from 'os';

export async function getSystemMetrics() {
  // DB Metrics
  let dbSize = 'Unknown';
  try {
    const result = await db.execute(sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`);
    dbSize = (result.rows[0] as any).size as string;
  } catch (e) {
    console.error('Failed to get DB size', e);
  }

  // OS Metrics
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round((usedMem / totalMem) * 100);
  const uptime = os.uptime();
  const cpus = os.cpus();
  
  // Redis & BullMQ Metrics
  let queueCounts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, prioritized: 0 };
  let redisMemory = 'Unknown';
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
    
    const queue = new Queue('events', { connection: connection as any });
    queueCounts = (await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'prioritized')) as any;
    
    const info = await connection.info('memory');
    const usedMemoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    if (usedMemoryMatch) {
      redisMemory = usedMemoryMatch[1];
    }
    
    await queue.close();
    connection.disconnect();
  } catch (e) {
    console.error('Failed to get Redis stats', e);
  }

  return {
    dbSize,
    os: {
      totalMem,
      usedMem,
      memUsagePercent,
      uptime,
      cpus: cpus.length,
      loadavg: os.loadavg(),
      arch: os.arch(),
      platform: os.platform(),
      release: os.release()
    },
    redis: {
      memory: redisMemory,
      queueCounts
    }
  };
}
