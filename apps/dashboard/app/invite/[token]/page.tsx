import { db } from '@/lib/db';
import { invites } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { AcceptInviteForm } from './AcceptInviteForm';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

export const dynamic = 'force-dynamic';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  const inviteList = await db.select().from(invites).where(eq(invites.token, token));
  const invite = inviteList[0];

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-[#fdfdfc] font-sans">
        <div className="w-full max-w-sm p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl shadow-2xl text-center">
          <h1 className="text-xl font-serif text-white mb-2">Invalid Invite</h1>
          <p className="text-neutral-500 text-sm">This invite link is invalid, has expired, or has already been used.</p>
        </div>
      </div>
    );
  }

  if (new Date() > new Date(invite.expiresAt)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-[#fdfdfc] font-sans">
        <div className="w-full max-w-sm p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl shadow-2xl text-center">
          <h1 className="text-xl font-serif text-white mb-2">Invite Expired</h1>
          <p className="text-neutral-500 text-sm">This 48-hour invite link has expired. Please ask the workspace owner to generate a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthSplitLayout 
      quote="The ultimate truth serum for user behavior. If there's a bug, you can literally watch it happen."
      author="Frontend Architect, Web3 Labs"
    >
      <AcceptInviteForm token={token} email={invite.email} role={invite.role} />
    </AuthSplitLayout>
  );
}
