import { cookies } from 'next/headers';
import FunnelsClient from './funnels-client';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { funnels } from '@rewind/shared';
import { eq, desc, sql } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Funnels - Rewind',
};

export default async function FunnelsPage() {
  const cookieStore = await cookies();
  const projectId = cookieStore.get('rewind_active_project')?.value || 'all';

  let initialFunnels: any[] = [];
  let initialEvents: string[] = [];

  try {
    if (projectId !== 'all') {
      const list = await db.select().from(funnels)
        .where(eq(funnels.projectId, projectId))
        .orderBy(desc(funnels.createdAt));
      initialFunnels = list;

      const query = sql`
        SELECT DISTINCT jsonb_array_elements_text(custom_events) as event_name
        FROM sessions
        WHERE project_id = ${projectId}
          AND jsonb_typeof(custom_events) = 'array'
        LIMIT 100
      `;
      const { rows } = await db.execute(query);
      initialEvents = rows.map((r: any) => r.event_name).filter(Boolean);
    }
  } catch (err) {
    console.error('Failed to fetch initial funnel data', err);
  }

  return (
    <FunnelsClient 
      projectId={projectId} 
      initialFunnels={initialFunnels} 
      initialEvents={initialEvents} 
    />
  );
}
