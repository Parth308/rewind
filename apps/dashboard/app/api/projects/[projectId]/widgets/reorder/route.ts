import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dashboardWidgets } from '@rewind/shared';
import { eq, and, isNull } from 'drizzle-orm';

export async function PUT(req: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await context.params;
    const body = await req.json();
    
    if (!body.orderedIds || !Array.isArray(body.orderedIds)) {
      return NextResponse.json({ error: 'orderedIds array is required' }, { status: 400 });
    }

    const targetProjectId = params.projectId === 'all' ? null : params.projectId;

    // Update each widget's position based on its index in the orderedIds array
    await Promise.all(body.orderedIds.map((id: string, index: number) => {
      return db.update(dashboardWidgets)
        .set({ position: index })
        .where(and(
          eq(dashboardWidgets.id, id),
          targetProjectId === null ? isNull(dashboardWidgets.projectId) : eq(dashboardWidgets.projectId, targetProjectId)
        ));
    }));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to reorder widgets' }, { status: 500 });
  }
}
