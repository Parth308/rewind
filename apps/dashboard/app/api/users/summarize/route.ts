import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, sessionEmbeddings, projects } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { getLanguageModel } from '@rewind/shared/src/ai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const { userId, projectId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Fetch the project config
    let projectConfig;
    if (projectId && projectId !== 'all') {
      const projectRecords = await db.select().from(projects).where(eq(projects.id, projectId));
      projectConfig = projectRecords.length > 0 ? (projectRecords[0].settings as any)?.ai : undefined;
    }

    // Fetch all session narratives for this user
    const userSessions = await db.select({
      id: sessions.id,
      narrative: sessionEmbeddings.narrative,
      errorCount: sessions.errorCount,
      hasRageClicks: sessions.hasRageClicks
    })
    .from(sessions)
    .leftJoin(sessionEmbeddings, eq(sessions.id, sessionEmbeddings.sessionId))
    .where(eq(sessions.userId, userId));

    if (userSessions.length === 0) {
      return NextResponse.json({ error: 'No sessions found for user' }, { status: 404 });
    }

    // Build the context string
    let contextString = '';
    for (const s of userSessions) {
      if (s.narrative) {
        contextString += `\n\nSession ID: ${s.id}\nFriction: ${s.errorCount ? `${s.errorCount} Errors` : '0 Errors'}, ${s.hasRageClicks ? 'Rage Clicks' : 'No Rage Clicks'}\nNarrative: ${s.narrative}`;
      }
    }

    if (!contextString.trim()) {
       // Just fallback to returning text if no narratives
       return new Response("No detailed session narratives are available yet for this user. They might still be processing.", { status: 200 });
    }

    const systemPrompt = `
      You are an expert Tier 3 Customer Support Analyst and Detective. 
      You are given a chronological list of session narratives and friction flags for a specific user.
      
      Your goal is to generate a "Customer Support Brief" that rapidly gets a support agent up to speed on this user's lifetime behavior, focusing heavily on identifying problems.
      
      CRITICAL INSTRUCTIONS:
      1. Write a direct, highly analytical brief. No pleasantries.
      2. Identify the most severe or recurring problems (errors, rage clicks, failures).
      3. Describe anything "fishy" or unusual (e.g. erratic behavior, repeated failures on the same page, signs of being a bot or malicious).
      4. Point out what their likely goal or intent is, and whether they succeeded or are currently blocked.
      5. Explicitly state the *last known problem* they experienced.
      6. Use markdown formatting (bullet points, bold text for emphasis).
    `;

    const model = getLanguageModel(projectConfig);

    const result = streamText({
      model,
      system: systemPrompt,
      prompt: `User Session History:\n${contextString}`,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('[User Summary] Error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
