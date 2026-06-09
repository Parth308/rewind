import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await context.params;
    
    const query = sql`
      SELECT DISTINCT jsonb_array_elements_text(custom_events) as event_name
      FROM sessions
      WHERE project_id = ${params.projectId}
        AND jsonb_typeof(custom_events) = 'array'
      LIMIT 100
    `;
    
    const { rows } = await db.execute(query);
    const eventsList = rows.map((r: any) => r.event_name).filter(Boolean);
    
    return NextResponse.json({ success: true, events: eventsList });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
