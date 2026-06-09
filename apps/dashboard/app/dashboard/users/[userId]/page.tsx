import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessions, projects } from '@rewind/shared';
import { eq, desc, and } from 'drizzle-orm';
import Link from 'next/link';
import { Clock, Monitor, Globe, User, History, ArrowLeft, Folder, AlertTriangle, AlertCircle, Copy, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { UserIdCopy } from './UserIdCopy';
import { UserAiSummary } from './UserAiSummary';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const decodedUserId = decodeURIComponent(userId);
  
  const cookieStore = await cookies();
  const projectId = cookieStore.get('rewind_active_project')?.value || 'all';

  // Fetch all sessions for this user
  let baseQuery = db.select({
    session: sessions,
    projectName: projects.name,
  })
  .from(sessions)
  .leftJoin(projects, eq(projects.id, sessions.projectId));
  
  const conditions = [eq(sessions.userId, decodedUserId)];
  if (projectId !== 'all') {
    conditions.push(eq(sessions.projectId, projectId));
  }

  const userSessionsData = await baseQuery
    .where(and(...conditions))
    .orderBy(desc(sessions.startedAt));

  // Merge metadata from all sessions to get the latest comprehensive profile
  // and compute aggregate stats
  let mergedMetadata: Record<string, any> = {};
  let totalDuration = 0;
  let totalErrors = 0;
  let totalRageClicks = 0;
  let firstSeen: Date | null = null;
  let lastSeen: Date | null = null;

  for (const { session: s } of userSessionsData) {
    if (s.metadata) {
      mergedMetadata = { ...mergedMetadata, ...(s.metadata as Record<string, any>) };
    }
    if (s.durationMs) totalDuration += s.durationMs;
    if (s.errorCount) totalErrors += s.errorCount;
    if (s.hasRageClicks) totalRageClicks += 1;
    
    if (s.startedAt) {
      const d = new Date(s.startedAt);
      if (!firstSeen || d < firstSeen) firstSeen = d;
      if (!lastSeen || d > lastSeen) lastSeen = d;
    }
  }

  const totalDurationStr = totalDuration >= 60000 
    ? `${Math.floor(totalDuration / 60000)}m ${Math.round((totalDuration % 60000) / 1000)}s`
    : `${Math.round(totalDuration / 1000)}s`;

  const isLongUUID = decodedUserId.length > 30 && decodedUserId.includes('-');
  const displayId = isLongUUID ? `${decodedUserId.substring(0, 8)}...${decodedUserId.substring(decodedUserId.length - 4)}` : decodedUserId;

  return (
    <div className="flex flex-col gap-10 pb-10 min-h-[calc(100vh-10rem)]">
      <Link href="/dashboard/search" className="text-neutral-500 hover:text-white flex items-center gap-2 w-fit transition-colors font-mono text-sm">
        <ArrowLeft className="w-4 h-4" /> BACK TO SEARCH
      </Link>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3 text-[var(--color-accent-green)]">
            <User className="w-8 h-8" />
            <h1 className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              {displayId}
              <UserIdCopy userId={decodedUserId} />
            </h1>
          </div>
          <p className="text-lg text-white/[0.618] max-w-xl">
            {userSessionsData.length} total session{userSessionsData.length === 1 ? '' : 's'} recorded.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-xl p-5">
          <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-2">First Seen</div>
          <div className="font-mono text-white">{firstSeen ? format(firstSeen, 'MMM d, yyyy') : '—'}</div>
        </div>
        <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-xl p-5">
          <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-2">Total Time Spent</div>
          <div className="font-mono text-white">{totalDurationStr}</div>
        </div>
        <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-xl p-5">
          <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-2">Total Errors</div>
          <div className={`font-mono ${totalErrors > 0 ? 'text-red-400 font-bold' : 'text-white'}`}>{totalErrors}</div>
        </div>
        <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-xl p-5">
          <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-2">Rage Clicks</div>
          <div className={`font-mono ${totalRageClicks > 0 ? 'text-amber-400 font-bold' : 'text-white'}`}>{totalRageClicks} sessions</div>
        </div>
      </div>

      <UserAiSummary userId={decodedUserId} projectId={projectId} />

      {Object.keys(mergedMetadata).length > 0 && (
        <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 bottom-0 left-0 w-1 bg-[var(--color-accent-green)]" />
           <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-[var(--color-accent-green)] font-bold mb-6 flex items-center gap-2">
             Known Attributes
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {Object.entries(mergedMetadata).map(([key, value]) => (
               <div key={key}>
                 <div className="text-xs text-neutral-500 uppercase font-mono tracking-wider mb-2">{key}</div>
                 <div className="text-white text-sm font-medium bg-white/5 p-3 rounded-lg border border-white/10">{String(value)}</div>
               </div>
             ))}
           </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-neutral-500 font-bold mb-8 flex items-center gap-2">
          <History className="w-4 h-4" /> Session Timeline
        </h3>
        <div className="flex flex-col relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-[var(--color-accent-green)]/50 before:via-[var(--color-border-dark)] before:to-transparent">
          {userSessionsData.map(({ session, projectName }, i) => {
            const dur = session.durationMs;
            const durStr = dur
              ? dur >= 60000
                ? `${Math.floor(dur / 60000)}m ${Math.round((dur % 60000) / 1000)}s`
                : `${Math.round(dur / 1000)}s`
              : '—';

            return (
              <div key={session.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8 last:mb-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[var(--color-border-dark)] bg-[#0A0A0A] text-[var(--color-accent-green)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 group-hover:border-[var(--color-accent-green)] transition-all shadow-[0_0_15px_rgba(163,230,53,0.1)] group-hover:shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent-green)]" />
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl border border-[var(--color-border-dark)] bg-[#0A0A0A] shadow-xl group-hover:border-[var(--color-accent-green)]/40 hover:bg-white/[0.02] transition-all cursor-pointer group-hover:-translate-y-1">
                  <Link href={`/dashboard/sessions/${session.id}`} className="block">
                    <div className="flex items-center justify-between mb-4">
                      <time className="font-mono text-xs text-neutral-400">
                        {session.startedAt ? formatDistanceToNow(new Date(session.startedAt), { addSuffix: true }) : ''}
                      </time>
                      <div className="flex items-center gap-2">
                        {session.errorCount && session.errorCount > 0 ? (
                          <div className="text-[10px] text-red-400 font-mono bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {session.errorCount} ERRORS
                          </div>
                        ) : null}
                        {session.hasRageClicks && (
                          <div className="text-[10px] text-amber-400 font-mono bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> RAGE CLICKS
                          </div>
                        )}
                        <div className="text-[10px] text-[var(--color-accent-green)] font-mono bg-[var(--color-accent-green)]/10 px-2 py-0.5 rounded border border-[var(--color-accent-green)]/20">
                          {durStr}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-sm text-neutral-300 truncate mb-3 group-hover:text-white transition-colors">{session.id}</div>
                    
                    {Array.isArray(session.customEvents) && session.customEvents.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-5">
                        {(session.customEvents as string[]).map((eventName, idx) => (
                          <div key={idx} className="text-[10px] text-[var(--color-accent-green)] font-mono bg-[var(--color-accent-green)]/10 px-2 py-0.5 rounded border border-[var(--color-accent-green)]/20 shadow-[0_0_10px_rgba(163,230,53,0.1)] truncate max-w-[200px]">
                            {eventName}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-xs text-neutral-500 font-mono items-center">
                       <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> {session.browser}</span>
                       <span className="flex items-center gap-2"><Monitor className="w-3.5 h-3.5" /> {session.os}</span>
                       {projectId === 'all' && projectName && (
                         <span className="flex items-center gap-1.5 text-neutral-400 bg-white/5 px-2 py-1 rounded border border-white/10">
                           <Folder className="w-3 h-3" /> {projectName}
                         </span>
                       )}
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
