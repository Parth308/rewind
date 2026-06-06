import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, sessionEmbeddings, projects, aiUsageLogs, generateSessionEmbedding } from '@rewind/shared';
import { desc, sql, eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { query, projectId, limit = 20 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Fetch project config
    const projectRecords = await db.select().from(projects).where(eq(projects.id, projectId));
    const projectConfig = projectRecords.length > 0 ? (projectRecords[0].settings as any)?.ai : undefined;

    // 1. Generate an embedding for the user's natural language query
    console.log(`[Search] Vectorizing query: "${query}"`);
    const { embedding: queryEmbedding, usage, provider, modelUsed } = await generateSessionEmbedding(query, projectConfig);

    // Log embedding usage
    await db.insert(aiUsageLogs).values({
      projectId: projectId,
      action: 'semantic_search',
      provider: provider,
      model: modelUsed,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
    });

    // 2. Perform Hybrid Search (Vector Similarity + SQL Filters)
    const vectorString = JSON.stringify(queryEmbedding);

    console.log(`[Search] Executing pgvector lookup...`);
    const results = await db
      .select({
        session: sessions,
        narrative: sessionEmbeddings.narrative,
        distance: sql<number>`${sessionEmbeddings.embedding} <=> ${vectorString}::vector`.as('distance'),
      })
      .from(sessionEmbeddings)
      .innerJoin(sessions, eq(sessions.id, sessionEmbeddings.sessionId))
      .where(eq(sessions.projectId, projectId))
      .orderBy(sql`${sessionEmbeddings.embedding} <=> ${vectorString}::vector`)
      .limit(limit);

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[Search] Error executing semantic search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
