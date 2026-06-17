'use server';

import { db } from '@/lib/db';
import { sharedSessions, sessions } from '@rewind/shared';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

export async function createShareToken(sessionId: string, expiresInDays: number = 7) {
  try {
    const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (existingSession.length === 0) {
      return { error: 'Session not found' };
    }

    // Check if an active, unexpired token already exists for this session
    const existingShared = await db.select()
      .from(sharedSessions)
      .where(eq(sharedSessions.sessionId, sessionId));
      
    const activeShare = existingShared.find(s => new Date(s.expiresAt).getTime() > Date.now());
    
    if (activeShare) {
      return { token: activeShare.token };
    }

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await db.insert(sharedSessions).values({
      sessionId,
      token,
      expiresAt,
    });

    return { token };
  } catch (err) {
    console.error('Failed to create share token:', err);
    return { error: 'Failed to generate share link' };
  }
}
