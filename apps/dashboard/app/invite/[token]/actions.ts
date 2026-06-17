'use server';

import { db } from '@/lib/db';
import { users, invites } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { hashPassword, createSessionCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function acceptInvite(prevState: any, formData: FormData) {
  const token = formData.get('token') as string;
  const name = formData.get('name') as string;
  const password = formData.get('password') as string;

  if (!token || !name || !password) {
    return { error: 'All fields are required.' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  // Verify the invite token
  const inviteList = await db.select().from(invites).where(eq(invites.token, token));
  const invite = inviteList[0];

  if (!invite) {
    return { error: 'Invalid or expired invite link.' };
  }

  if (new Date() > new Date(invite.expiresAt)) {
    // Optionally clean it up
    await db.delete(invites).where(eq(invites.id, invite.id));
    return { error: 'This invite link has expired.' };
  }

  // Create the new user
  const hashedPassword = await hashPassword(password);
  
  const [newUser] = await db.insert(users).values({
    email: invite.email,
    name,
    passwordHash: hashedPassword,
    role: invite.role,
  }).returning({ id: users.id, role: users.role });

  // Delete the invite so it cannot be reused
  await db.delete(invites).where(eq(invites.id, invite.id));

  // Log them in!
  await createSessionCookie(newUser.id, newUser.role);

  // Note: we can't redirect directly inside a try/catch if we had one, but here we can.
  // Wait, Next.js 14+ redirect inside an action throws an error that is handled by Next.js router.
  // So it MUST NOT be caught by a local try/catch.
  redirect('/dashboard');
}
