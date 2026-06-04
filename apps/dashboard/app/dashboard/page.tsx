import Link from 'next/link';
import { db } from '@/lib/db';
import { sessions, projects } from '@rewind/shared';
import { desc, count } from 'drizzle-orm';
import { formatDistanceToNow } from 'date-fns';
import { OnboardingGuide } from '@/components/ui/onboarding-guide';
import { FadeUp } from '@/components/ui/fade-up';
import { MonitorPlay, Terminal, Globe, Clock, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardSessions() {
  const [{ value: sessionCount }] = await db.select({ value: count() }).from(sessions);
  const [{ value: projectCount }] = await db.select({ value: count() }).from(projects);

  const allSessions = await db.select()
    .from(sessions)
    .orderBy(desc(sessions.startedAt))
    .limit(50);

  const firstProject = projectCount > 0
    ? (await db.select().from(projects).limit(1))[0]
    : null;

  if (sessionCount === 0) {
    return (
      <OnboardingGuide
        hasProject={projectCount > 0}
        projectToken={firstProject?.token ?? null}
      />
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Page Header */}
      <FadeUp>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">Sessions.</h1>
            <p className="text-lg text-neutral-400 font-mono">
              <span className="text-[var(--color-accent-green)]">{sessionCount}</span> recorded streams · <span className="text-indigo-400">{projectCount}</span> active nodes
            </p>
          </div>
        </div>
      </FadeUp>

      {/* Main Content Area */}
      <FadeUp delay={0.1} className="flex-1">
        <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl relative overflow-hidden flex flex-col min-h-[500px] shadow-2xl">
          {/* Ambient Glow & Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[var(--color-accent-green)] opacity-[0.02] blur-[100px] pointer-events-none rounded-full" />
          
          {/* Header Row */}
          <div className="hidden lg:grid grid-cols-12 gap-6 px-8 py-6 border-b border-[var(--color-border-dark)] bg-black/40 relative z-10 backdrop-blur-md">
            <div className="col-span-5 text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-neutral-600" /> Session Identity
            </div>
            <div className="col-span-3 text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-neutral-600" /> Environment
            </div>
            <div className="col-span-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-600" /> Duration
            </div>
            <div className="col-span-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 font-bold flex items-center gap-2">
              Timestamp
            </div>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto relative z-10">
            {allSessions.map((session, i) => {
              const isActive = session.status === 'active';
              const dur = session.durationMs;
              const durStr = dur
                ? dur >= 60000
                  ? `${Math.floor(dur / 60000)}m ${Math.round((dur % 60000) / 1000)}s`
                  : `${Math.round(dur / 1000)}s`
                : null;

              return (
                <Link
                  key={session.id}
                  href={`/dashboard/sessions/${session.id}`}
                  className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 lg:items-center px-6 py-6 lg:px-8 transition-all hover:bg-white/[0.04] group border-b border-[var(--color-border-dark)] last:border-b-0 relative"
                >
                  {/* Hover indicator */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-accent-green)] opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(163,230,53,0.5)]" />

                  {/* Session ID + status */}
                  <div className="lg:col-span-5 flex items-center gap-4 lg:gap-5 min-w-0">
                    <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
                      <div className={`absolute inset-0 rounded-full border border-dashed ${isActive ? 'border-[var(--color-accent-green)]/40 animate-[spin_4s_linear_infinite]' : 'border-neutral-600'}`} />
                      <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-[var(--color-accent-green)] shadow-[0_0_8px_var(--color-accent-green)]' : 'bg-neutral-600'}`} />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-base lg:text-lg text-white group-hover:text-[var(--color-accent-green)] transition-colors truncate">
                        {session.id}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 lg:mt-2">
                        {session.errorCount && session.errorCount > 0 ? (
                          <div className="text-[10px] lg:text-xs text-red-400 font-mono bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                            {session.errorCount} CRITICAL ERRORS
                          </div>
                        ) : (
                          <div className="text-[10px] lg:text-xs text-neutral-500 font-mono tracking-widest uppercase">
                            {session.country || 'UNKNOWN ORIGIN'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Environment & Metadata (Mobile Stacked, Desktop Grid) */}
                  <div className="lg:col-span-7 grid grid-cols-2 lg:grid-cols-7 gap-4 lg:gap-0 pl-14 lg:pl-0">
                    {/* Environment */}
                    <div className="col-span-1 lg:col-span-3 min-w-0 flex flex-col gap-1 lg:gap-1.5">
                      <div className="text-sm lg:text-base text-neutral-300 font-medium truncate group-hover:text-white transition-colors flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-neutral-600 lg:hidden shrink-0" />
                        <span className="truncate">{session.browser || 'Unknown Client'}</span>
                      </div>
                      <div className="text-xs text-neutral-500 font-mono pl-5 lg:pl-0 truncate">
                        {session.os || 'Unknown OS'}
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="col-span-1 lg:col-span-2 lg:pr-6 min-w-0">
                      {durStr ? (
                        <div className="flex flex-col gap-2">
                          <div className="font-mono text-sm lg:text-base text-neutral-300 group-hover:text-white transition-colors flex items-center gap-2 truncate">
                            <Clock className="w-3.5 h-3.5 text-neutral-600 lg:hidden shrink-0" />
                            {durStr}
                          </div>
                          <div className="hidden lg:flex h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--color-accent-green)] opacity-60 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(163,230,53,0.5)]"
                              style={{
                                width: `${Math.min(((dur || 0) / 300000) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-700 font-mono text-sm pl-5 lg:pl-0 flex items-center gap-2 truncate">
                           <Clock className="w-3.5 h-3.5 text-neutral-600 lg:hidden shrink-0" /> —
                        </span>
                      )}
                    </div>

                    {/* When */}
                    <div className="col-span-2 lg:col-span-2 flex items-center justify-between mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-[var(--color-border-dark)] lg:border-0">
                      <span className="text-xs lg:text-sm font-mono text-neutral-400 group-hover:text-neutral-300 transition-colors">
                        {session.startedAt
                          ? formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })
                          : '—'}
                      </span>
                      <div className="hidden lg:flex w-8 h-8 rounded-full bg-white/5 items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 border border-white/10">
                        <MonitorPlay className="w-4 h-4 text-[var(--color-accent-green)] ml-0.5" />
                      </div>
                      <div className="lg:hidden flex items-center text-[var(--color-accent-green)] text-xs font-mono tracking-widest uppercase">
                        View <ChevronRight className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--color-border-dark)] bg-black/40 relative z-10">
            <span className="text-xs font-mono tracking-[0.1em] text-neutral-500 uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent-green)]/50" />
              Showing {allSessions.length} of {sessionCount}
            </span>
            <span className="text-xs font-mono tracking-[0.1em] text-neutral-500 uppercase">
              Sorted by Recency
            </span>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
