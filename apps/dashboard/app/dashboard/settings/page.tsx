import { SettingsView } from './SettingsView';
import { db } from '@/lib/db';
import { users, invites } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const userResult = await db.select().from(users).where(eq(users.id, session.userId as string));
  const user = userResult[0];

  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
  }).from(users);

  const pendingInvites = await db.select().from(invites);

  return (
    <SettingsView 
      initialName={user?.name || 'Admin User'} 
      initialEmail={user?.email || 'admin@rewind.dev'} 
      users={allUsers}
      invites={pendingInvites}
      currentUserRole={session.role as string}
    />
  );
}
