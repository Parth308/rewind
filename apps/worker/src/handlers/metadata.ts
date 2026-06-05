import { eq } from 'drizzle-orm';
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
}
