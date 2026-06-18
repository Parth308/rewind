'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { users, projects } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

import { getSession } from '@/lib/auth';

export async function createProject(formData: FormData) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') throw new Error('Action disabled in Demo Mode.');
  const name = (formData.get('name') as string)?.trim();
  if (!name || name.length < 2) return;

  const session = await getSession();
  if (!session) return;
  const userId = session.userId as string;
  const token = randomBytes(32).toString('hex');

  await db.insert(projects).values({ name, userId, token });
  revalidatePath('/dashboard/projects');
}

export async function deleteProject(projectId: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return;
  await db.delete(projects).where(eq(projects.id, projectId));
  revalidatePath('/dashboard/projects');
}
