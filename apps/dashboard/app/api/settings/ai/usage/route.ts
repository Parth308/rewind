import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiUsageLogs, projects } from '@rewind/shared';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const allProjects = await db.select().from(projects).limit(1);
    if (allProjects.length === 0) {
      return NextResponse.json({ success: true, usage: [], totalTokens: 0 });
    }

    const projectId = allProjects[0].id;

    // Aggregate tokens by model for this project
    const usageData = await db
      .select({
        model: aiUsageLogs.model,
        totalTokens: sql<number>`sum(${aiUsageLogs.totalTokens})`,
      })
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.projectId, projectId))
      .groupBy(aiUsageLogs.model);

    // Sum all tokens
    const totalTokens = await db
      .select({
        total: sql<number>`sum(${aiUsageLogs.totalTokens})`,
      })
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.projectId, projectId));

    return NextResponse.json({
      success: true,
      usage: usageData.map(u => ({ model: u.model, totalTokens: Number(u.totalTokens) || 0 })),
      totalTokens: Number(totalTokens[0]?.total) || 0,
    });
  } catch (error) {
    console.error('[Settings] Error fetching AI usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
