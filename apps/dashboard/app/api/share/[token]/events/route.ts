import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events, sharedSessions } from '@rewind/shared';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: Request, props: { params: Promise<{ token: string }> }) {
  try {
    const params = await props.params;
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const shared = await db.select().from(sharedSessions).where(eq(sharedSessions.token, token));
    if (shared.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    const shareRecord = shared[0];
    if (new Date(shareRecord.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This share link has expired' }, { status: 410 });
    }

    const dbEvents = await db.select()
      .from(events)
      .where(eq(events.sessionId, shareRecord.sessionId))
      .orderBy(asc(events.timestamp));

    const payload = dbEvents.map(e => e.data);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Failed to fetch shared session events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
