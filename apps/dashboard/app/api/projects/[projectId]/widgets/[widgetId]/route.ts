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
