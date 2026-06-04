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
      const { sessionId, userAgent } = payload;
      let os = payload.os || 'Unknown';
      let browser = payload.browser || 'Unknown';
      
      if (userAgent) {
        const parser = new UAParser(userAgent);
        const parsedOs = parser.getOS();
        const parsedBrowser = parser.getBrowser();
        if (parsedOs.name) os = `${parsedOs.name} ${parsedOs.version || ''}`.trim();
        if (parsedBrowser.name) browser = `${parsedBrowser.name} ${parsedBrowser.version || ''}`.trim();
      }
      
      // Ensure session exists or update it if it does
      const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (existingSession.length === 0) {
        await db.insert(sessions).values({
          id: sessionId,
          projectId,
          os: os || 'Unknown',
          browser: browser || 'Unknown',
          startedAt: new Date(),
        });
      } else {
        await db.update(sessions).set({
          os: os || existingSession[0].os,
          browser: browser || existingSession[0].browser,
        }).where(eq(sessions.id, sessionId));
      }
    } else if (payload.type === 'batch' && payload.events && payload.events.length > 0) {
      const sessionId = payload.sessionId;
      
      // Ensure session exists before inserting events to prevent FK constraint errors
      let existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (existingSession.length === 0) {
        const newSession = {
          id: sessionId,
          projectId,
          os: 'Unknown',
          browser: 'Unknown',
          startedAt: new Date(),
        };
        await db.insert(sessions).values(newSession);
        existingSession = [newSession as any];
      }

      const lastEvent = payload.events[payload.events.length - 1];
      if (lastEvent && existingSession[0]?.startedAt) {
        const durationMs = new Date(lastEvent.timestamp).getTime() - new Date(existingSession[0].startedAt).getTime();
        if (durationMs > 0) {
          await db.update(sessions).set({ durationMs }).where(eq(sessions.id, sessionId));
        }
      }

      // Insert rrweb events
      const rrwebEvents = payload.events.filter((e: any) => typeof e.type === 'number' || !e.type.startsWith('custom_'));
      if (rrwebEvents.length > 0) {
        await db.insert(events).values(rrwebEvents.map((e: any) => ({
          sessionId,
          type: e.type,
          timestamp: new Date(e.timestamp).getTime(),
          data: e
        })));
      }
      
    } else if (payload.type === 'console') {
      const sessionId = payload.sessionId;
      // Ensure session exists
      const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (existingSession.length === 0) {
        await db.insert(sessions).values({ id: sessionId, projectId, os: 'Unknown', browser: 'Unknown', startedAt: new Date() });
      }
      
      await db.insert(consoleLogs).values(payload.entries.map((e: any) => ({
        sessionId,
        level: e.level,
        message: e.message,
        timestamp: e.timestamp
      })));
    } else if (payload.type === 'network') {
      const sessionId = payload.sessionId;
      // Ensure session exists
      const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (existingSession.length === 0) {
        await db.insert(sessions).values({ id: sessionId, projectId, os: 'Unknown', browser: 'Unknown', startedAt: new Date() });
      }
      
      await db.insert(networkRequests).values(payload.requests.map((e: any) => ({
        sessionId,
        method: e.method,
        url: e.url,
        status: e.status,
        duration: e.duration,
        timestamp: e.timestamp
      })));
    }
  }
}, { connection: redis as any });

worker.on('completed', (job) => {
  // console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with ${err.message}`);
});
