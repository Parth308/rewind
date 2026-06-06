import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, projects } from '@rewind/shared';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // In a real app with auth, we'd get the user ID from session.
    // For now, we'll just get the first project and user.
    const allProjects = await db.select().from(projects).limit(1);
    const allUsers = await db.select().from(users).limit(1);
    
    let projectSettings = {};
    let userSettings = {};
    
    if (allProjects.length > 0) {
      projectSettings = allProjects[0].settings || {};
    }
    if (allUsers.length > 0) {
      userSettings = allUsers[0].settings || {};
    }

    // Merge strategy: Project settings override User settings override process.env
    const envSettings = {
      provider: process.env.AI_PROVIDER || 'google',
      googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
      languageModel: process.env.AI_PROVIDER === 'openai' ? 'gpt-4o-mini' : process.env.AI_PROVIDER === 'anthropic' ? 'claude-3-5-sonnet-20240620' : 'gemini-2.5-flash',
      embeddingModel: process.env.AI_PROVIDER === 'openai' ? 'text-embedding-3-small' : 'gemini-embedding-001',
    };

    return NextResponse.json({
      success: true,
      settings: {
        ...envSettings,
        ...(userSettings as any)?.ai,
        ...(projectSettings as any)?.ai,
      },
      env: {
        hasGoogleKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        hasOpenAiKey: !!process.env.OPENAI_API_KEY,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      }
    });
  } catch (error) {
    console.error('[Settings] Error fetching AI settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { provider, googleApiKey, openaiApiKey, anthropicApiKey, languageModel, embeddingModel, scope } = body;

    const newAiSettings = {
      provider,
      googleApiKey,
      openaiApiKey,
      anthropicApiKey,
      languageModel,
      embeddingModel,
    };

    if (scope === 'global') {
      const allUsers = await db.select().from(users).limit(1);
      if (allUsers.length > 0) {
        const existingSettings = allUsers[0].settings || {};
        await db.update(users)
          .set({ settings: { ...existingSettings, ai: newAiSettings } })
          .where(eq(users.id, allUsers[0].id));
      }
    } else {
      // Per-project
      const allProjects = await db.select().from(projects).limit(1);
      if (allProjects.length > 0) {
        const existingSettings = allProjects[0].settings || {};
        await db.update(projects)
          .set({ settings: { ...existingSettings, ai: newAiSettings } })
          .where(eq(projects.id, allProjects[0].id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Settings] Error updating AI settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
