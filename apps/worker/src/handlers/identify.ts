import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { sessions } from '@rewind/shared';

export async function handleIdentify(projectId: string, payload: any) {
  const { sessionId, userId, metadata } = payload;
  
  if (!sessionId || !userId) return;

  const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  
  if (existingSession.length === 0) {
    // Session not created yet by metadata, so let's create it with userId
    await db.insert(sessions).values({
      id: sessionId,
      projectId,
      userId,
      metadata: metadata || {},
      os: 'Unknown',
      browser: 'Unknown',
      startedAt: new Date(),
    }).onConflictDoNothing();
  } else {
    // Session exists, merge metadata and set userId
    await db.update(sessions).set({
      userId,
      metadata: sql`COALESCE(${sessions.metadata}, '{}'::jsonb) || ${metadata ? JSON.stringify(metadata) : "'{}'"}::jsonb`,
    }).where(eq(sessions.id, sessionId));
  }
}
