import { eq, min, max } from 'drizzle-orm';
import { db } from '../db';
import { sessions, events } from '@rewind/shared';
import { detectFrustrationSignals } from '../utils/frustration';

export async function handleBatch(projectId: string, payload: any) {
  if (!payload.events || payload.events.length === 0) return;

  const sessionId = payload.sessionId;
  const batchEvents: any[] = payload.events;

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

  // ── Recompute duration from ALL stored events (pure client clock) ─────────
  // We aggregate across ALL batches so each new batch extends duration correctly.
  // Using SQL min/max avoids fetching every event row.
  const [agg] = await db
    .select({
      earliest: min(events.timestamp),
      latest:   max(events.timestamp),
    })
    .from(events)
    .where(eq(events.sessionId, sessionId));

  const earliest = Number(agg?.earliest ?? firstClientTs);
  const latest   = Number(agg?.latest   ?? lastClientTs);
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

  await db.update(sessions).set(updateData).where(eq(sessions.id, sessionId));
}
