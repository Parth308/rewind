import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dashboardWidgets } from '@rewind/shared';
import { eq, and, isNull } from 'drizzle-orm';

export async function DELETE(req: NextRequest, context: { params: Promise<{ projectId: string, widgetId: string }> }) {
  try {
    const params = await context.params;
    const targetProjectId = params.projectId === 'all' ? null : params.projectId;
    
    await db.delete(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.id, params.widgetId),
        targetProjectId === null ? isNull(dashboardWidgets.projectId) : eq(dashboardWidgets.projectId, targetProjectId)
      ));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete widget' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ projectId: string, widgetId: string }> }) {
  try {
    const params = await context.params;
    const targetProjectId = params.projectId === 'all' ? null : params.projectId;
    const body = await req.json();
    
    // Fetch current widget to merge config
    const currentWidgets = await db.select().from(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.id, params.widgetId),
        targetProjectId === null ? isNull(dashboardWidgets.projectId) : eq(dashboardWidgets.projectId, targetProjectId)
      ));
      
    if (!currentWidgets.length) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }
    
    const widget = currentWidgets[0];
    const newConfig = { ...(widget.config as object), ...(body.config || {}) };
    
    await db.update(dashboardWidgets)
      .set({ config: newConfig })
      .where(and(
        eq(dashboardWidgets.id, params.widgetId),
        targetProjectId === null ? isNull(dashboardWidgets.projectId) : eq(dashboardWidgets.projectId, targetProjectId)
      ));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update widget' }, { status: 500 });
  }
}
