import { db } from '@/lib/db';
import { sessions, sessionEmbeddings, projects, aiUsageLogs, generateSessionEmbedding } from '@rewind/shared';
import { desc, sql, eq, or, ilike, and } from 'drizzle-orm';

export function shouldSkipLLM(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return true;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) return true;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed)) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) return true;
  if (!trimmed.includes(' ') && trimmed.length <= 5) return true;
  return false;
}

export async function performSemanticSearch(query: string, projectId: string, page = 1, pageSize = 20) {
  if (!query) {
    throw new Error('Query is required');
  }

  const offset = (page - 1) * pageSize;

  let projectConfig;
  if (projectId !== 'all') {
    const projectRecords = await db.select().from(projects).where(eq(projects.id, projectId));
    projectConfig = projectRecords.length > 0 ? (projectRecords[0].settings as any)?.ai : undefined;
  }

  const isExactQuery = shouldSkipLLM(query);
  const cleanQuery = query.trim().replace(/^"|"$/g, '');
  const searchQuery = `%${cleanQuery}%`;

  let results: any[] = [];
  let totalCount = 0;
  let searchType = 'ai';

  if (isExactQuery) {
    searchType = 'direct';
    console.log(`[Search] Skipping LLM for exact query: "${cleanQuery}"`);
    
    const whereClause = and(
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
    );

    // Count query
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sessions)
      .leftJoin(sessionEmbeddings, eq(sessions.id, sessionEmbeddings.sessionId))
      .where(whereClause);
      
    totalCount = Number(count);

    // Data query
    results = await db
      .select({
        session: sessions,
        narrative: sql`COALESCE(${sessionEmbeddings.narrative}, ${sessions.notes})`.as('narrative'),
        distance: sql<number>`0`.as('distance'),
        projectName: projects.name,
      })
      .from(sessions)
      .leftJoin(sessionEmbeddings, eq(sessions.id, sessionEmbeddings.sessionId))
      .leftJoin(projects, eq(projects.id, sessions.projectId))
      .where(whereClause)
      .limit(pageSize)
      .offset(offset);
  } else {
    searchType = 'ai';
    console.log(`[Search] Vectorizing query: "${cleanQuery}"`);
    const { embedding: queryEmbedding, usage, provider, modelUsed } = await generateSessionEmbedding(cleanQuery, projectConfig);

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

    const vectorString = JSON.stringify(queryEmbedding);

    console.log(`[Search] Executing pgvector lookup...`);
    const CANDIDATE_LIMIT = 100; // Fetch up to 100 to allow in-memory pagination of best semantic matches
    
    const hybridResults = await db
      .select({
        session: sessions,
        narrative: sql`COALESCE(${sessionEmbeddings.narrative}, ${sessions.notes})`.as('narrative'),
        distance: sql<number>`
          LEAST(
            COALESCE((${sessionEmbeddings.embedding} <=> cast(${vectorString} as vector)), 1.0),
            CASE 
              WHEN cast(${sessions.id} as text) ILIKE ${searchQuery} THEN 0.0
              WHEN cast(${sessions.userId} as text) ILIKE ${searchQuery} THEN 0.0
              WHEN cast(${sessions.entryUrl} as text) ILIKE ${searchQuery} THEN 0.1
              WHEN cast(${sessions.browser} as text) ILIKE ${searchQuery} THEN 0.2
              WHEN cast(${sessions.os} as text) ILIKE ${searchQuery} THEN 0.2
              WHEN cast(${sessions.device} as text) ILIKE ${searchQuery} THEN 0.2
              WHEN cast(${sessions.country} as text) ILIKE ${searchQuery} THEN 0.2
              WHEN cast(${sessions.tags} as text) ILIKE ${searchQuery} THEN 0.1
              WHEN cast(${sessions.customEvents} as text) ILIKE ${searchQuery} THEN 0.2
              WHEN cast(${sessions.notes} as text) ILIKE ${searchQuery} THEN 0.1
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
              WHEN cast(${sessions.userId} as text) ILIKE ${searchQuery} THEN 0.0
              WHEN cast(${sessions.entryUrl} as text) ILIKE ${searchQuery} THEN 0.1
              WHEN cast(${sessions.browser} as text) ILIKE ${searchQuery} THEN 0.2
              WHEN cast(${sessions.os} as text) ILIKE ${searchQuery} THEN 0.2
              WHEN cast(${sessions.device} as text) ILIKE ${searchQuery} THEN 0.2
              WHEN cast(${sessions.country} as text) ILIKE ${searchQuery} THEN 0.2
              WHEN cast(${sessions.tags} as text) ILIKE ${searchQuery} THEN 0.1
              WHEN cast(${sessions.customEvents} as text) ILIKE ${searchQuery} THEN 0.2
              WHEN cast(${sessions.notes} as text) ILIKE ${searchQuery} THEN 0.1
              ELSE 1.0
            END
          )
      `)
      .limit(CANDIDATE_LIMIT);

    const validMatches = hybridResults.filter(r => (1 - r.distance) >= 0.60);
    totalCount = validMatches.length;
    results = validMatches.slice(offset, offset + pageSize);
    
    console.log(`[Search] Lookup complete. Found ${hybridResults.length} raw matches, filtered to ${totalCount} valid semantic matches.`);
  }

  return { results, searchType, totalCount };
}
