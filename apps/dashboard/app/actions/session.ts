"use server"

import { db } from '@/lib/db';
import { sessions } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateSessionNotes(sessionId: string, tags: string[], notes: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return;

  await db.update(sessions)
    .set({ tags, notes })
    .where(eq(sessions.id, sessionId));
  
  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/sessions/${sessionId}`);
}
