import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@rewind/shared';
import { eq, ilike, and, isNotNull } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  const query = url.searchParams.get('q');

  if (!projectId || !query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const conditions = [
      isNotNull(sessions.userId),
      ilike(sessions.userId, `%${query}%`)
    ];
    if (projectId !== 'all') {
      conditions.push(eq(sessions.projectId, projectId));
    }

    const results = await db
      .selectDistinct({ userId: sessions.userId })
      .from(sessions)
      .where(and(...conditions))
      .limit(5);

    return NextResponse.json({ results: results.map(r => r.userId) });
  } catch (error) {
    console.error('[Autocomplete] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
