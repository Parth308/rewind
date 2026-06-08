import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { sessions } from '@rewind/shared';
import UAParser from 'ua-parser-js';

export async function handleMetadata(projectId: string, payload: any) {
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
  
  const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (existingSession.length === 0) {
    await db.insert(sessions).values({
      id: sessionId,
      projectId,
      userId: payload.metadata?.userId || null,
      metadata: payload.metadata || {},
      os: os || 'Unknown',
      browser: browser || 'Unknown',
      startedAt: new Date(),
    });
  } else {
    // Session exists, merge OS/browser and userId/metadata if provided
    const updateData: any = {
      os: os || existingSession[0].os,
      browser: browser || existingSession[0].browser,
    };
    
    if (payload.metadata?.userId) {
      updateData.userId = payload.metadata.userId;
    }
    
    if (payload.metadata && Object.keys(payload.metadata).length > 0) {
      // Use SQL merge for metadata
      await db.update(sessions).set({
        ...updateData,
        metadata: sql`COALESCE(${sessions.metadata}, '{}'::jsonb) || ${JSON.stringify(payload.metadata)}::jsonb`,
      }).where(eq(sessions.id, sessionId));
    } else {
      await db.update(sessions).set(updateData).where(eq(sessions.id, sessionId));
    }
  }
}
