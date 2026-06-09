import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dashboardWidgets } from '@rewind/shared';
import { eq, asc, isNull } from 'drizzle-orm';

export async function GET(req: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await context.params;
    const targetProjectId = params.projectId === 'all' ? null : params.projectId;
    const list = await db.select().from(dashboardWidgets)
      .where(targetProjectId === null ? isNull(dashboardWidgets.projectId) : eq(dashboardWidgets.projectId, targetProjectId))
      .orderBy(asc(dashboardWidgets.position));
    return NextResponse.json({ success: true, widgets: list });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch widgets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await context.params;
    const body = await req.json();
    
    if (!body.type || !body.metric) {
      return NextResponse.json({ error: 'Type and metric are required' }, { status: 400 });
    }

    const targetProjectId = params.projectId === 'all' ? null : params.projectId;
    const newWidget = await db.insert(dashboardWidgets).values({
      projectId: targetProjectId,
      type: body.type,
      metric: body.metric,
      config: body.config || {},
      position: body.position || 0,
    } as any).returning();

    return NextResponse.json({ success: true, widget: newWidget[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create widget' }, { status: 500 });
  }
}
