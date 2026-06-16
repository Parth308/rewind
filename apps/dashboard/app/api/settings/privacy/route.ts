import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const projectId = cookieStore.get('rewind_active_project')?.value;

    if (!projectId || projectId === 'all') {
      return NextResponse.json({ error: 'No active project selected' }, { status: 400 });
    }

    const activeProject = await db.select().from(projects).where(eq(projects.id, projectId));
    if (activeProject.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const settings = (activeProject[0].settings as any) || {};

    return NextResponse.json({
      success: true,
      settings: {
        maskInputs: settings.maskInputs !== undefined ? settings.maskInputs : true,
        maskSelectors: settings.maskSelectors || [],
        blockSelectors: settings.blockSelectors || [],
        ignoreUrls: settings.ignoreUrls || [],
      }
    });
  } catch (error) {
    console.error('[Settings] Error fetching privacy settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { maskInputs, maskSelectors, blockSelectors, ignoreUrls } = body;

    const cookieStore = await cookies();
    const projectId = cookieStore.get('rewind_active_project')?.value;

    if (!projectId || projectId === 'all') {
      return NextResponse.json({ error: 'No active project selected' }, { status: 400 });
    }

    const activeProject = await db.select().from(projects).where(eq(projects.id, projectId));
    if (activeProject.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const existingSettings = (activeProject[0].settings as any) || {};
    
    await db.update(projects)
      .set({
        settings: {
          ...existingSettings,
          maskInputs,
          maskSelectors,
          blockSelectors,
          ignoreUrls
        }
      })
      .where(eq(projects.id, projectId));

    // Pre-build the static script and cache it in Redis
    try {
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      const remoteConfig = { maskInputs, maskSelectors, blockSelectors, ignoreUrls };
      const configScript = `window.__rewind_remote = ${JSON.stringify(remoteConfig)};\n`;
      await redis.set(`tracker:config:${activeProject[0].token}`, configScript);
      await redis.quit();
    } catch (redisErr) {
      console.error('[Settings] Failed to update Redis cache for tracking config', redisErr);
      // We don't fail the request if redis caching fails, as the ingestor can fallback to DB
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Settings] Error updating privacy settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
