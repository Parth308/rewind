'use server';

import { db } from '@/lib/db';
import { users, invites } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';

export async function createInvite(prevState: any, formData: FormData) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return { error: 'Action disabled in Demo Mode.' };
  }

  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized.' };
  }

  // Only owners and admins can invite. Let's say only owner for now, or check role.
  if (session.role !== 'owner' && session.role !== 'admin') {
    return { error: 'You do not have permission to invite members.' };
  }

  const email = formData.get('email') as string;
  const role = formData.get('role') as string;

  if (!email || !role) {
    return { error: 'Email and role are required.' };
  }

  // Check if user already exists
  const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existingUser.length > 0) {
    return { error: 'User with this email already exists in the workspace.' };
  }

  // Check if invite already exists
  const existingInvite = await db.select({ id: invites.id }).from(invites).where(eq(invites.email, email));
  if (existingInvite.length > 0) {
    // We could resend or update it, but let's just delete the old one to keep it simple
    await db.delete(invites).where(eq(invites.email, email));
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  await db.insert(invites).values({
    email,
    token,
    role,
    invitedBy: session.userId as string,
    expiresAt,
  });

  revalidatePath('/dashboard/settings');

  return { success: true, token };
}

export async function deleteInvite(inviteId: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return;
  const session = await getSession();
  if (!session || (session.role !== 'owner' && session.role !== 'admin')) return;

  await db.delete(invites).where(eq(invites.id, inviteId));
  revalidatePath('/dashboard/settings');
}

export async function removeUser(userId: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return;
  const session = await getSession();
  if (!session || session.role !== 'owner') return; // Only owner can remove active users

  if (userId === session.userId) return; // Cannot remove self

  await db.delete(users).where(eq(users.id, userId));
  revalidatePath('/dashboard/settings');
}
