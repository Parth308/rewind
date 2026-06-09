import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dashboardWidgets } from '@rewind/shared';
import { eq, and } from 'drizzle-orm';

export async function DELETE(req: NextRequest, context: { params: Promise<{ projectId: string, widgetId: string }> }) {
  try {
    const params = await context.params;
    
    await db.delete(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.id, params.widgetId),
        eq(dashboardWidgets.projectId, params.projectId)
      ));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete widget' }, { status: 500 });
  }
}
