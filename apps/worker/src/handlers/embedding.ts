import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sessions, projects, events, networkRequests, consoleLogs, sessionEmbeddings, aiUsageLogs, summarizeSession, generateSessionEmbedding } from '@rewind/shared';

export async function handleEmbedding(sessionId: string) {
  console.log(`[Embedding] ▶ Starting for session: ${sessionId}`);

  // 1. Check if it's already embedded (we will update if it is)
  const existing = await db.select().from(sessionEmbeddings).where(eq(sessionEmbeddings.sessionId, sessionId));
  const isUpdate = existing.length > 0;
  if (isUpdate) {
    console.log(`[Embedding] ⟳ Session ${sessionId} already embedded, updating...`);
  }

  // 2. Fetch session
  const sessionRecords = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (sessionRecords.length === 0) {
    console.log(`[Embedding] ✗ Session ${sessionId} not found in DB.`);
    return;
  }
  const session = sessionRecords[0];
  console.log(`[Embedding] ✓ Session found. projectId=${session.projectId}`);

  // 3. Fetch related data
  const sessionEvents = await db.select().from(events).where(eq(events.sessionId, sessionId));
  const sessionNetwork = await db.select().from(networkRequests).where(eq(networkRequests.sessionId, sessionId));
  const sessionConsole = await db.select().from(consoleLogs).where(eq(consoleLogs.sessionId, sessionId));

  console.log(`[Embedding] Data: events=${sessionEvents.length} network=${sessionNetwork.length} console=${sessionConsole.length}`);

  if (sessionEvents.length === 0) {
    console.log(`[Embedding] ⏭ No events found for session ${sessionId}. Skipping (too thin).`);
    return;
  }

  // 4. Fetch project AI config
  const projectRecords = await db.select().from(projects).where(eq(projects.id, session.projectId));
  const projectConfig = projectRecords.length > 0 ? (projectRecords[0].settings as any)?.ai : undefined;
  console.log(`[Embedding] AI config: ${projectConfig ? JSON.stringify(projectConfig) : 'using env defaults'}`);

  // 5. Build context JSON (parse rrweb events into human-readable actions)
  let lastAction = '';
  let repeatCount = 0;
  const parsedActions: string[] = [];

  for (const e of sessionEvents) {
    const data: any = e.data || {};
    let action = '';
    
    if (e.type === 4 && data.href) action = `Navigated to: ${data.href}`;
    else if (e.type === 3 && data.source === 2 && data.type === 2) action = `Clicked`;
    else if (e.type === 3 && data.source === 3) action = `Scrolled`;
    else if (e.type === 3 && data.source === 5) action = `Typed input`;
    
    if (!action) continue;

    if (action === lastAction) {
      repeatCount++;
    } else {
      if (lastAction) {
        parsedActions.push(repeatCount > 1 ? `${lastAction} (${repeatCount} times)` : lastAction);
      }
      lastAction = action;
      repeatCount = 1;
    }
  }
  if (lastAction) {
    parsedActions.push(repeatCount > 1 ? `${lastAction} (${repeatCount} times)` : lastAction);
  }

  const contextData = {
    entryUrl: session.entryUrl,
    referrer: session.referrer,
    flags: {
      rageClicks: session.hasRageClicks,
      deadClicks: session.hasDeadClicks,
      uTurns: session.hasUTurns,
      wildScrolling: session.hasWildScrolling,
    },
    os: session.os,
    browser: session.browser,
    durationMs: session.durationMs,
  };

  const eventsJson = JSON.stringify({ context: contextData, actions: parsedActions.slice(0, 150) }); // Limit to avoid token blowout
  const networkJson = JSON.stringify(sessionNetwork.filter(n => (n.status || 200) >= 400).map(n => ({ method: n.method, url: n.url, status: n.status })));
  const consoleJson = JSON.stringify(sessionConsole.filter(c => c.level === 'error' || c.level === 'warn').map(c => ({ level: c.level, msg: c.message })));

  try {
    console.log(`[Embedding] Calling summarizeSession...`);
    const { text: narrative, usage: narrativeUsage, provider: narrativeProvider, modelUsed: narrativeModel } = await summarizeSession(eventsJson, networkJson, consoleJson, projectConfig);
    console.log(`[Embedding] ✓ Narrative generated (${narrative.length} chars) via ${narrativeProvider}/${narrativeModel} | tokens=${narrativeUsage.totalTokens}`);

    // Log summarize usage
    await db.insert(aiUsageLogs).values({
      projectId: session.projectId,
      action: 'summarize_session',
      provider: narrativeProvider,
      model: narrativeModel,
      promptTokens: narrativeUsage.inputTokens,
      completionTokens: narrativeUsage.outputTokens,
      totalTokens: narrativeUsage.totalTokens,
    });

    console.log(`[Embedding] Calling generateSessionEmbedding...`);
    const { embedding, usage: embedUsage, provider: embedProvider, modelUsed: embedModel } = await generateSessionEmbedding(narrative, projectConfig);
    // Vercel AI SDK currently returns NaN for Gemini embedding tokens, so we estimate 1 token per 4 chars
    const embedTokens = isNaN(embedUsage.tokens) ? Math.ceil(narrative.length / 4) : embedUsage.tokens;
    console.log(`[Embedding] ✓ Embedding generated (${embedding.length} dims) via ${embedProvider}/${embedModel} | tokens=${embedTokens}`);

    // Log embed usage — EmbeddingModelUsage only has .tokens (no prompt/completion split)
    await db.insert(aiUsageLogs).values({
      projectId: session.projectId,
      action: 'embed_session',
      provider: embedProvider,
      model: embedModel,
      promptTokens: embedTokens,
      completionTokens: 0,
      totalTokens: embedTokens,
    });

    // 6. Save to pgvector
    if (isUpdate) {
      await db.update(sessionEmbeddings)
        .set({
          narrative,
          embedding,
          modelUsed: embedModel,
        })
        .where(eq(sessionEmbeddings.sessionId, sessionId));
      console.log(`[Embedding] ✓ Embedding updated in DB for session: ${sessionId}`);
    } else {
      await db.insert(sessionEmbeddings).values({
        sessionId,
        narrative,
        embedding,
        modelUsed: embedModel,
      });
      console.log(`[Embedding] ✓ Embedding saved to DB for session: ${sessionId}`);
    }
  } catch (err: any) {
    console.error(`[Embedding] ✗ Failed for session ${sessionId}:`, err?.message || err);
    throw err;
  }
}
