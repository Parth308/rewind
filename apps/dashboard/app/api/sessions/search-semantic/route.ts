import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, sessionEmbeddings, projects, aiUsageLogs, generateSessionEmbedding } from '@rewind/shared';
import { desc, sql, eq, or, ilike, and } from 'drizzle-orm';

function shouldSkipLLM(query: string): boolean {
  const trimmed = query.trim();
  // 1. Wrapped in quotes
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return true;
  // 2. URL or Path
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) return true;
  // 3. UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed)) return true;
  // 4. Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) return true;
  // 5. Short acronym (single word, no spaces, length <= 5)
  if (!trimmed.includes(' ') && trimmed.length <= 5) return true;

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { query, projectId, limit = 20 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Fetch project config if a specific project is selected
    let projectConfig;
    if (projectId !== 'all') {
      const projectRecords = await db.select().from(projects).where(eq(projects.id, projectId));
      projectConfig = projectRecords.length > 0 ? (projectRecords[0].settings as any)?.ai : undefined;
    }

    const isExactQuery = shouldSkipLLM(query);
    const cleanQuery = query.trim().replace(/^"|"$/g, ''); // strip quotes for the search
    const searchQuery = `%${cleanQuery}%`;

    let results: any[] = [];
    let searchType = 'ai';

    if (isExactQuery) {
      searchType = 'direct';
      console.log(`[Search] Skipping LLM for exact query: "${cleanQuery}"`);
      
      results = await db
        .select({
          session: sessions,
          narrative: sql`COALESCE(${sessionEmbeddings.narrative}, ${sessions.notes})`.as('narrative'),
          distance: sql<number>`0`.as('distance'), // 0 distance = 100% match
          projectName: projects.name,
        })
        .from(sessions)
        .leftJoin(sessionEmbeddings, eq(sessions.id, sessionEmbeddings.sessionId))
        .leftJoin(projects, eq(projects.id, sessions.projectId))
        .where(
          and(
            projectId !== 'all' ? eq(sessions.projectId, projectId) : undefined,
            or(
              sql`cast(${sessions.id} as text) ILIKE ${searchQuery}`,
              sql`cast(${sessions.customEvents} as text) ILIKE ${searchQuery}`,
              sql`cast(${sessions.tags} as text) ILIKE ${searchQuery}`,
              ilike(sessions.entryUrl, searchQuery),
              ilike(sessions.userId, searchQuery),
              ilike(sessionEmbeddings.narrative, searchQuery),
              ilike(sessions.notes, searchQuery),
              ilike(sessions.browser, searchQuery),
              ilike(sessions.os, searchQuery),
              ilike(sessions.device, searchQuery),
              ilike(sessions.country, searchQuery),
              ilike(sessions.referrer, searchQuery)
            )
          )
        )
        .limit(limit);
    } else {
      searchType = 'ai';
      // 1. Generate an embedding for the user's natural language query
      console.log(`[Search] Vectorizing query: "${cleanQuery}"`);
      const { embedding: queryEmbedding, usage, provider, modelUsed } = await generateSessionEmbedding(cleanQuery, projectConfig);

      // Log embedding usage
      if (projectId !== 'all') {
        await db.insert(aiUsageLogs).values({
          projectId: projectId,
          action: 'semantic_search',
          provider: provider,
          model: modelUsed,
          promptTokens: usage?.tokens || 0,
          completionTokens: 0,
          totalTokens: usage?.tokens || 0,
        });
      }

      // 2. Perform Hybrid Search (Vector Similarity + SQL Filters)
      const vectorString = JSON.stringify(queryEmbedding);

      console.log(`[Search] Executing pgvector lookup...`);
      const hybridResults = await db
        .select({
          session: sessions,
          narrative: sql`COALESCE(${sessionEmbeddings.narrative}, ${sessions.notes})`.as('narrative'),
          distance: sql<number>`
            LEAST(
              COALESCE((${sessionEmbeddings.embedding} <=> cast(${vectorString} as vector)), 1.0),
              CASE 
                WHEN cast(${sessions.id} as text) ILIKE ${searchQuery} THEN 0.0
                WHEN ilike(${sessions.userId}, ${searchQuery}) THEN 0.0
                WHEN ilike(${sessions.entryUrl}, ${searchQuery}) THEN 0.1
                WHEN ilike(${sessions.browser}, ${searchQuery}) THEN 0.2
                WHEN ilike(${sessions.os}, ${searchQuery}) THEN 0.2
                WHEN ilike(${sessions.device}, ${searchQuery}) THEN 0.2
                WHEN ilike(${sessions.country}, ${searchQuery}) THEN 0.2
                WHEN cast(${sessions.tags} as text) ILIKE ${searchQuery} THEN 0.1
                WHEN cast(${sessions.customEvents} as text) ILIKE ${searchQuery} THEN 0.2
                WHEN ilike(${sessions.notes}, ${searchQuery}) THEN 0.1
                ELSE 1.0
              END
            )
          `.as('distance'),
          projectName: projects.name,
        })
        .from(sessions)
        .leftJoin(sessionEmbeddings, eq(sessions.id, sessionEmbeddings.sessionId))
        .leftJoin(projects, eq(projects.id, sessions.projectId))
        .where(projectId !== 'all' ? eq(sessions.projectId, projectId) : undefined)
        .orderBy(sql`
            LEAST(
              COALESCE((${sessionEmbeddings.embedding} <=> cast(${vectorString} as vector)), 1.0),
              CASE 
                WHEN cast(${sessions.id} as text) ILIKE ${searchQuery} THEN 0.0
                WHEN ilike(${sessions.userId}, ${searchQuery}) THEN 0.0
                WHEN ilike(${sessions.entryUrl}, ${searchQuery}) THEN 0.1
                WHEN ilike(${sessions.browser}, ${searchQuery}) THEN 0.2
                WHEN ilike(${sessions.os}, ${searchQuery}) THEN 0.2
                WHEN ilike(${sessions.device}, ${searchQuery}) THEN 0.2
                WHEN ilike(${sessions.country}, ${searchQuery}) THEN 0.2
                WHEN cast(${sessions.tags} as text) ILIKE ${searchQuery} THEN 0.1
                WHEN cast(${sessions.customEvents} as text) ILIKE ${searchQuery} THEN 0.2
                WHEN ilike(${sessions.notes}, ${searchQuery}) THEN 0.1
                ELSE 1.0
              END
            )
        `)
        .limit(limit);

      // Smart Thresholding: Only return results with a >= 60% semantic match
      results = hybridResults.filter(r => (1 - r.distance) >= 0.60);
      console.log(`[Search] Lookup complete. Found ${hybridResults.length} raw matches, filtered to ${results.length} valid semantic matches.`);
    }

    return NextResponse.json({ success: true, results, searchType });
  } catch (error) {
    console.error('[Search] Error executing search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
