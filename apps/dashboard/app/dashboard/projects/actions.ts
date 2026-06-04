'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { users, projects } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Ensure a dev user exists and return its id
async function getOrCreateDevUser(): Promise<string> {
  const DEV_EMAIL = 'admin@rewind.dev';
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, DEV_EMAIL));
  if (existing.length > 0) return existing[0].id;

  const [newUser] = await db.insert(users).values({
    email: DEV_EMAIL,
    passwordHash: '$2a$10$placeholder_hash_not_used_for_login',
    name: 'Admin',
  }).returning({ id: users.id });
  return newUser.id;
}

export async function createProject(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  if (!name || name.length < 2) return;

  const userId = await getOrCreateDevUser();
  const token = randomBytes(32).toString('hex');

  await db.insert(projects).values({ name, userId, token });
  revalidatePath('/dashboard/projects');
}

export async function deleteProject(projectId: string) {
  await db.delete(projects).where(eq(projects.id, projectId));
  revalidatePath('/dashboard/projects');
}
