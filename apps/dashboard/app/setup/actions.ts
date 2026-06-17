'use server';

import { db } from '@/lib/db';
import { users } from '@rewind/shared';
import { count } from 'drizzle-orm';
import { hashPassword, createSessionCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function setupOwnerAccount(prevState: any, formData: FormData) {
  // Verify that the database is actually empty (security check)
  const userCountResult = await db.select({ count: count() }).from(users);
  if (Number(userCountResult[0].count) > 0) {
    return { error: 'Setup has already been completed.' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password || !name) {
    return { error: 'All fields are required.' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  try {
    const hashedPassword = await hashPassword(password);
    const [newUser] = await db.insert(users).values({
      name,
      email,
      passwordHash: hashedPassword,
      role: 'owner',
    }).returning({ id: users.id });

    await createSessionCookie(newUser.id, 'owner');
  } catch (error: any) {
    console.error('Setup error:', error);
    return { error: 'Failed to create owner account. Please try again.' };
  }

  redirect('/dashboard');
}
