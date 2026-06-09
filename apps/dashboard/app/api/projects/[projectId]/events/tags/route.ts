import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await context.params;
    
    if (params.projectId === 'all') {
      return NextResponse.json({ success: true, tags: [] });
    }

    const res = await db.execute(sql`
      SELECT DISTINCT events.data->'data'->>'tag' as tag
      FROM events
      JOIN sessions ON events.session_id = sessions.id
      WHERE sessions.project_id = ${params.projectId}
        AND events.type = 5
        AND events.data->'data'->>'tag' IS NOT NULL
      ORDER BY tag ASC
      LIMIT 100
    `);

    const tags = res.rows.map((row: any) => row.tag);
    return NextResponse.json({ success: true, tags });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
