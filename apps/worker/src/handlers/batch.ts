import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sessions, events } from '@rewind/shared';
import { detectFrustrationSignals } from '../utils/frustration';

export async function handleBatch(projectId: string, payload: any) {
  if (!payload.events || payload.events.length === 0) return;

  const sessionId = payload.sessionId;
  
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

  const rrwebEvents = payload.events.filter((e: any) => typeof e.type === 'number' || !e.type.startsWith('custom_'));
  if (rrwebEvents.length > 0) {
    const flags = detectFrustrationSignals(rrwebEvents);
    
    const updateData: any = {};
    if (flags.hasRageClicks) updateData.hasRageClicks = true;
    if (flags.hasDeadClicks) updateData.hasDeadClicks = true;
    if (flags.hasUTurns) updateData.hasUTurns = true;
    if (flags.hasWildScrolling) updateData.hasWildScrolling = true;
    
    if (Object.keys(updateData).length > 0) {
      await db.update(sessions).set(updateData).where(eq(sessions.id, sessionId));
    }

    await db.insert(events).values(rrwebEvents.map((e: any) => ({
      sessionId,
      type: e.type,
      timestamp: new Date(e.timestamp).getTime(),
      data: e
    })));
  }
}
