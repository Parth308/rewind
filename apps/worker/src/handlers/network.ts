import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sessions, networkRequests } from '@rewind/shared';

export async function handleNetwork(projectId: string, payload: any) {
  const sessionId = payload.sessionId;
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
