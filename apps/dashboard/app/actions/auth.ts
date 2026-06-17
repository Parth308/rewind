'use server';

import { clearSessionCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function logout() {
  await clearSessionCookie();
  redirect('/login');
}
