'use server';

import { db } from '@/lib/db';
import { users } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { verifyPassword, createSessionCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  try {
    const userList = await db.select().from(users).where(eq(users.email, email));
    const user = userList[0];

    if (!user) {
      return { error: 'Invalid email or password.' };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { error: 'Invalid email or password.' };
    }

    await createSessionCookie(user.id, user.role);
  } catch (error: any) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  redirect('/dashboard');
}
