import { db } from '@/lib/db';
import { users } from '@rewind/shared';
import { count } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const c = await db.select({ count: count() }).from(users);
  
  if (Number(c[0].count) === 0) {
    redirect('/setup');
  }

  return (
    <AuthSplitLayout 
      quote="The exact tools you need to debug user sessions effortlessly. It's like having CCTV for your frontend state."
      author="Senior Engineer, SaaS Startup"
    >
      <LoginForm />
    </AuthSplitLayout>
  );
}
