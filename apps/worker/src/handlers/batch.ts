import { eq, min, max } from 'drizzle-orm';
import { db } from '../db';
import { sessions, events } from '@rewind/shared';
import { detectFrustrationSignals } from '../utils/frustration';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
const eventsQueue = new Queue('events', { connection: redis as any });

export async function handleBatch(projectId: string, payload: any) {
  if (!payload.events || payload.events.length === 0) return;

  const sessionId = payload.sessionId;
  const batchEvents: any[] = payload.events;
  console.log(`[Batch] session=${sessionId} events=${batchEvents.length} isFinal=${payload.isFinal ?? false}`);

  // ── Ensure session row exists ────────────────────────────────────────────
  // Prefer the metadata handler to create the row; this is a safety fallback.
  // Use the first rrweb event's timestamp as startedAt so it matches client clock.
  const firstClientTs = batchEvents[0].timestamp;
  const lastClientTs  = batchEvents[batchEvents.length - 1].timestamp;

  let existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (existingSession.length === 0) {
    const newSession = {
      id: sessionId,
      projectId,
      os: 'Unknown',
      browser: 'Unknown',
      // Use client timestamp so duration math is always on the same clock
      startedAt: new Date(firstClientTs),
    };
    await db.insert(sessions).values(newSession);
    existingSession = [newSession as any];
  }

  // ── Persist rrweb events ─────────────────────────────────────────────────
  const rrwebEvents = batchEvents.filter(
    (e: any) => typeof e.type === 'number' || !String(e.type).startsWith('custom_')
  );

  // Extract new Custom Events
  const newCustomEvents = new Set<string>();
  for (const ev of rrwebEvents) {
    if (ev.type === 5 && ev.data && ev.data.tag && ev.data.tag !== 'navigation') {
      newCustomEvents.add(ev.data.tag);
    }
  }

  if (rrwebEvents.length > 0) {
    await db.insert(events).values(
      rrwebEvents.map((e: any) => ({
        sessionId,
        type: e.type,
        timestamp: e.timestamp,   // store as raw ms epoch (bigint)
        data: e,
      }))
    );
  }

  // ── Compute duration incrementally to avoid expensive DB aggregations ──────
  // We use the existing session data instead of querying all rows in the events table
  const sess = existingSession[0] as any;
  const currentEarliest = sess.startedAt ? new Date(sess.startedAt).getTime() : firstClientTs;
  const currentLatest = currentEarliest + (sess.durationMs || 0);

  const earliest = Math.min(currentEarliest, firstClientTs);
  const latest   = Math.max(currentLatest, lastClientTs);
  const durationMs = latest - earliest;

  // ── Detect frustration signals and write everything in one update ─────────
  const flags = detectFrustrationSignals(rrwebEvents);

  const updateData: Record<string, any> = {
    durationMs: durationMs > 0 ? durationMs : 0,
    // Keep startedAt aligned to actual first event across all batches
    startedAt: new Date(earliest),
  };
  if (flags.hasRageClicks)   updateData.hasRageClicks   = true;
  if (flags.hasDeadClicks)   updateData.hasDeadClicks   = true;
  if (flags.hasUTurns)       updateData.hasUTurns       = true;
  if (flags.hasWildScrolling) updateData.hasWildScrolling = true;

  // Merge Custom Events
  if (newCustomEvents.size > 0) {
    const existingEvents: string[] = Array.isArray(existingSession[0]?.customEvents) 
      ? existingSession[0].customEvents as string[] 
      : [];
    const mergedEvents = Array.from(new Set([...existingEvents, ...Array.from(newCustomEvents)]));
    updateData.customEvents = mergedEvents;
  }

  await db.update(sessions).set(updateData).where(eq(sessions.id, sessionId));

  // ── Debounce AI Embedding ─────────────────────────────────────────────────
  // We debounce the summarization job by 15 seconds after the LAST activity.
  // This ensures that page navigations (which fire beforeunload and send a batch)
  // don't prematurely finalize the session if the user immediately loads another page.
  const jobId = `embed_${sessionId}`;
  const existingJob = await eventsQueue.getJob(jobId);
  if (existingJob) {
    const state = await existingJob.getState();
    if (state === 'delayed' || state === 'waiting' || state === 'completed' || state === 'failed') {
      await existingJob.remove();
    } else if (state === 'active') {
      // It's actively embedding right now. Don't queue again immediately.
      return;
    }
  }

  if (payload.isFinal) {
    console.log(`[Batch] Session ${sessionId} marked as final (tab hidden/closed). Queueing AI summarization...`);
  }

  await eventsQueue.add('embed_session', { sessionId }, {
    jobId,
    delay: 15000,
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 }
  });
}
