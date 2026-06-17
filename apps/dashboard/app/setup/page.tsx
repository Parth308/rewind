import { db } from '@/lib/db';
import { users } from '@rewind/shared';
import { count } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { SetupForm } from '@/components/auth/setup-form';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const c = await db.select({ count: count() }).from(users);
  
  if (Number(c[0].count) > 0) {
    redirect('/login');
  }

  return (
    <AuthSplitLayout 
      quote="The ability to self-host our session recordings changed the way we handle compliance. Complete ownership without the SaaS tax."
      author="DevOps Lead, FinTech Corp"
    >
      <SetupForm />
    </AuthSplitLayout>
  );
}
