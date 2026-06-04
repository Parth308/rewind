import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { events, sessions, networkRequests, consoleLogs, errors } from '@rewind/shared';
import UAParser from 'ua-parser-js';
import { eq } from 'drizzle-orm';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5433/rewind';

const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

console.log('Worker starting, listening to "events" queue...');

const worker = new Worker('events', async (job: Job) => {
  if (job.name === 'process_batch') {
    const { projectId, payload } = job.data;
    
    if (payload.type === 'metadata') {
      const { sessionId, os, browser, device } = payload;
      
      // Ensure session exists
      const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (existingSession.length === 0) {
        await db.insert(sessions).values({
          id: sessionId,
          projectId,
          os: os || 'Unknown',
          browser: browser || 'Unknown',
          startedAt: new Date(),
        });
      }
    } else if (payload.type === 'batch' && payload.events && payload.events.length > 0) {
      const sessionId = payload.sessionId;
      
      // Insert rrweb events
      const rrwebEvents = payload.events.filter((e: any) => !e.type.startsWith('custom_'));
      if (rrwebEvents.length > 0) {
        await db.insert(events).values(rrwebEvents.map((e: any) => ({
          sessionId,
          type: e.type,
          timestamp: new Date(e.timestamp).getTime(),
          data: e
        })));
      }
      
      // Filter out custom events (console, network, error)
      const consoleEvents = payload.events.filter((e: any) => e.type === 'custom_console');
      if (consoleEvents.length > 0) {
        await db.insert(consoleLogs).values(consoleEvents.map((e: any) => ({
          sessionId,
          level: e.data.level,
          message: e.data.message,
          timestamp: new Date(e.timestamp).getTime()
        })));
      }

      const networkEvents = payload.events.filter((e: any) => e.type === 'custom_network');
      if (networkEvents.length > 0) {
        await db.insert(networkRequests).values(networkEvents.map((e: any) => ({
          sessionId,
          method: e.data.method,
          url: e.data.url,
          status: e.data.status,
          duration: e.data.duration,
          timestamp: new Date(e.timestamp).getTime()
        })));
      }

      const errorEvents = payload.events.filter((e: any) => e.type === 'custom_error');
      if (errorEvents.length > 0) {
        await db.insert(errors).values(errorEvents.map((e: any) => ({
          sessionId,
          message: e.data.message,
          stack: e.data.stacktrace,
          timestamp: new Date(e.timestamp).getTime()
        })));
      }
      
      console.log(`Processed batch for session ${sessionId}, total: ${payload.events.length}`);
    }
  }
}, { connection: redis as any });

worker.on('completed', (job) => {
  // console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with ${err.message}`);
});
