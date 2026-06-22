import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dashboardWidgets, sessions, events, errors } from '@rewind/shared';
import { eq, and, sql, isNull } from 'drizzle-orm';

export async function GET(req: NextRequest, context: { params: Promise<{ projectId: string, widgetId: string }> }) {
  try {
    const params = await context.params;
    
    // 1. Fetch widget config
    let widget: any;
    const targetProjectId = params.projectId === 'all' ? null : params.projectId;
    
    const rows = await db.select().from(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.id, params.widgetId),
        targetProjectId === null ? isNull(dashboardWidgets.projectId) : eq(dashboardWidgets.projectId, targetProjectId)
      ));
    
    if (rows.length === 0) return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    widget = rows[0];

    // 2. Fetch data based on metric using shared lib
    const { getWidgetData } = await import('@/lib/widget-data');
    const result = await getWidgetData(params.projectId, widget);
    
    return NextResponse.json(result);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch widget data' }, { status: 500 });
  }
}
