import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sessions, consoleLogs } from '@rewind/shared';

export async function handleConsole(projectId: string, payload: any) {
  const sessionId = payload.sessionId;
  const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (existingSession.length === 0) {
    await db.insert(sessions).values({ id: sessionId, projectId, os: 'Unknown', browser: 'Unknown', startedAt: new Date() }).onConflictDoNothing();
  }
  
  await db.insert(consoleLogs).values(payload.entries.map((e: any) => ({
    sessionId,
    level: e.level,
    message: e.message,
    timestamp: e.timestamp
  })));
}
