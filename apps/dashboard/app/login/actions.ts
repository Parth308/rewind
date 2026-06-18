'use server';

import { db } from '@/lib/db';
import { users } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { verifyPassword, createSessionCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginUser(prevState: any, formData: FormData) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return { error: 'Standard login is disabled in Demo Mode.' };
  }

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

export async function demoLogin() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return { error: 'Demo mode is not enabled on this environment.' };
  }
  
  // Set a dummy admin session cookie for the demo viewer
  // Use a valid UUID format to prevent Postgres syntax errors when querying the users table
  await createSessionCookie('00000000-0000-0000-0000-000000000000', 'admin');
  redirect('/dashboard');
}
