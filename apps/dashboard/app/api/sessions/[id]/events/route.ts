import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events } from '@rewind/shared';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const sessionId = params.id;
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Fetch the events directly. Next.js will stream the JSON response back to the client, 
    // avoiding the heavy SSR serialization process that causes OOM.
    const dbEvents = await db.select()
      .from(events)
      .where(eq(events.sessionId, sessionId))
      .orderBy(asc(events.timestamp));

    const payload = dbEvents.map(e => e.data);

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Failed to fetch session events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
