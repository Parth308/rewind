import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funnels } from '@rewind/shared';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await context.params;
    const list = await db.select().from(funnels)
      .where(eq(funnels.projectId, params.projectId))
      .orderBy(desc(funnels.createdAt));
    return NextResponse.json({ success: true, funnels: list });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch funnels' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await context.params;
    const body = await req.json();
    
    if (!body.name || !body.steps || body.steps.length === 0) {
      return NextResponse.json({ error: 'Name and steps are required' }, { status: 400 });
    }

    const newFunnel = await db.insert(funnels).values({
      projectId: params.projectId,
      name: body.name,
      description: body.description || '',
      steps: body.steps,
      filters: body.filters || {},
      timeWindowMs: body.timeWindowMs || 1800000
    }).returning();

    return NextResponse.json({ success: true, funnel: newFunnel[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to save funnel' }, { status: 500 });
  }
}
