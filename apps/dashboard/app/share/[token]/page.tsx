import { db } from '@/lib/db';
import { sharedSessions, sessions, consoleLogs, networkRequests } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { SessionContent } from '@/components/ui/session-content';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PublicSharedSession(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;

  const sharedList = await db.select().from(sharedSessions).where(eq(sharedSessions.token, params.token));
  const shareRecord = sharedList[0];

  if (!shareRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="font-mono text-center">
          <h1 className="text-2xl text-red-500 mb-2">Link Not Found</h1>
          <p className="text-neutral-500">This share link does not exist.</p>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line
  if (new Date(shareRecord.expiresAt).getTime() < Date.now()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="font-mono text-center">
          <h1 className="text-2xl text-yellow-500 mb-2">Link Expired</h1>
          <p className="text-neutral-500">This share link has expired.</p>
        </div>
      </div>
    );
  }

  const sessionList = await db.select().from(sessions).where(eq(sessions.id, shareRecord.sessionId));
  const session = sessionList[0];

  if (!session) {
    notFound();
  }

  const logs = await db.select().from(consoleLogs).where(eq(consoleLogs.sessionId, session.id)).orderBy(consoleLogs.timestamp);
  const network = await db.select().from(networkRequests).where(eq(networkRequests.sessionId, session.id)).orderBy(networkRequests.timestamp);

  const totalMs = session.durationMs ?? 0;

  return (
    <div className="w-full h-screen bg-black flex flex-col overflow-hidden">
      {/* Simple Public Top Bar */}
      <div className="flex items-center justify-between p-4 bg-[#0A0A0A] border-b border-[var(--color-border-dark)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-[var(--color-accent-green)] rounded flex items-center justify-center text-black font-bold font-mono text-xs">
            R
          </div>
          <span className="font-mono text-sm tracking-widest text-neutral-300">REWIND PUBLIC REPLAY</span>
        </div>
        <div className="text-xs font-mono text-neutral-500">
          {/* eslint-disable-next-line */}
          Expires in {Math.round((new Date(shareRecord.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-2">
        <SessionContent
          sessionId={session.id}
          totalMs={totalMs}
          logs={logs}
          network={network}
          eventsEndpoint={`/api/share/${params.token}/events`}
          isPublic={true}
        />
      </div>
    </div>
  );
}
