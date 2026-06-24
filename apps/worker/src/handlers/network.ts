import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sessions, networkRequests } from '@rewind/shared';

export async function handleNetwork(projectId: string, payload: any) {
  const sessionId = payload.sessionId;
  const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (existingSession.length === 0) {
    await db.insert(sessions).values({ id: sessionId, projectId, os: 'Unknown', browser: 'Unknown', startedAt: new Date() }).onConflictDoNothing();
  }
  
  const CHUNK_SIZE = 5000;
  for (let i = 0; i < payload.requests.length; i += CHUNK_SIZE) {
    const chunk = payload.requests.slice(i, i + CHUNK_SIZE);
    await db.insert(networkRequests).values(chunk.map((e: any) => ({
      sessionId,
      method: e.method,
      url: e.url,
      status: e.status,
      duration: e.duration,
      requestBody: e.requestBody,
      responseBody: e.responseBody,
      timestamp: e.timestamp
    })));
  }
}
