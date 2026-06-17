import Link from 'next/link';
import { db } from '@/lib/db';
import { sessions, projects } from '@rewind/shared';
import { desc, count, eq, and, gt, isNotNull, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { formatDistanceToNow } from 'date-fns';
import { OnboardingGuide } from '@/components/ui/onboarding-guide';
import { FadeUp } from '@/components/ui/fade-up';
import { SessionFilters } from '@/components/ui/session-filters';
import { Pagination } from '@/components/ui/pagination';
import { MonitorPlay, Terminal, Globe, Clock, ChevronRight, Flame, MousePointerClick, CornerUpLeft, ChevronsUpDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardSessions({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const cookieStore = await cookies();
  const projectId = cookieStore.get('rewind_active_project')?.value || 'all';
  const sp = await searchParams;

  // 1. Check if there are ANY sessions at all (for onboarding)
  const [{ value: totalProjectSessions }] = await db
    .select({ value: count() })
    .from(sessions)
    .where(projectId !== 'all' ? eq(sessions.projectId, projectId) : undefined);

  const [{ value: projectCount }] = await db.select({ value: count() }).from(projects);

  let activeProject = null;
  if (projectId !== 'all') {
    const records = await db.select().from(projects).where(eq(projects.id, projectId));
    activeProject = records.length > 0 ? records[0] : null;
  } else if (projectCount > 0) {
    activeProject = (await db.select().from(projects).limit(1))[0];
  }

  if (totalProjectSessions === 0) {
    return (
      <OnboardingGuide
        hasProject={projectCount > 0}
        projectToken={activeProject?.token ?? null}
        projectName={activeProject?.name ?? null}
        isGlobal={projectId === 'all'}
      />
    );
  }

  // 2. Build Dynamic Filters
  const conditions = [];
  if (projectId !== 'all') conditions.push(eq(sessions.projectId, projectId));
  if (sp.browser) conditions.push(eq(sessions.browser, String(sp.browser)));
  if (sp.os) conditions.push(eq(sessions.os, String(sp.os)));
  if (sp.country) conditions.push(eq(sessions.country, String(sp.country)));
  if (sp.hasErrors === 'true') conditions.push(gt(sessions.errorCount, 0));
  
  if (sp.frustration === 'rage') conditions.push(eq(sessions.hasRageClicks, true));
  if (sp.frustration === 'dead') conditions.push(eq(sessions.hasDeadClicks, true));
  if (sp.frustration === 'uturn') conditions.push(eq(sessions.hasUTurns, true));
  if (sp.frustration === 'wild') conditions.push(eq(sessions.hasWildScrolling, true));
  if (sp.tag) conditions.push(sql`${sessions.tags} @> ${JSON.stringify([sp.tag])}::jsonb`);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 3. Execute Filtered Count
  let sessionCountQuery = db.select({ value: count() }).from(sessions);
  if (whereClause) sessionCountQuery = sessionCountQuery.where(whereClause) as any;
  const [{ value: filteredCount }] = await sessionCountQuery;

  // 4. Execute Paginated Data Fetch
  const page = Number(sp.page) || 1;
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  let sessionsQuery = db.select({
    session: sessions,
    projectName: projects.name,
  })
  .from(sessions)
  .leftJoin(projects, eq(projects.id, sessions.projectId));

  if (whereClause) {
    sessionsQuery = sessionsQuery.where(whereClause) as any;
  }

  const allSessionsData = await sessionsQuery
    .orderBy(desc(sessions.startedAt))
    .limit(pageSize)
    .offset(offset);

  const maxDuration = allSessionsData.reduce((m, {session: s}) => Math.max(m, s.durationMs ?? 0), 0) || 1;

  // 5. Fetch distinct options for filter dropdowns
  const baseWhere = projectId !== 'all' ? eq(sessions.projectId, projectId) : undefined;
  
  const browsersRes = await db.selectDistinct({ browser: sessions.browser })
    .from(sessions).where(and(baseWhere, isNotNull(sessions.browser)));
  const osesRes = await db.selectDistinct({ os: sessions.os })
    .from(sessions).where(and(baseWhere, isNotNull(sessions.os)));
  const countriesRes = await db.selectDistinct({ country: sessions.country })
    .from(sessions).where(and(baseWhere, isNotNull(sessions.country)));

  const browsers = browsersRes.map(r => r.browser as string).filter(Boolean).sort();
  const oses = osesRes.map(r => r.os as string).filter(Boolean).sort();
  const countries = countriesRes.map(r => r.country as string).filter(Boolean).sort();

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Page Header */}
      <FadeUp>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">Sessions.</h1>
            <p className="text-lg text-white/[0.618] font-mono">
              <span className="text-[var(--color-accent-green)] font-bold">{filteredCount}</span> recorded streams
              <span className="text-neutral-500 mx-2">&middot;</span> {projectCount} active nodes
            </p>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.05}>
        <SessionFilters browsers={browsers} oses={oses} countries={countries} />
      </FadeUp>

      {/* Main Content Area */}
      <FadeUp delay={0.1} className="flex-1 flex flex-col">
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
          <div className="flex-1 relative z-10">
            {allSessionsData.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 font-mono text-sm uppercase tracking-widest">
                No sessions match your filters.
              </div>
            ) : (
              allSessionsData.map(({session, projectName}, i) => {
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
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 lg:mt-2">
                          {(session.errorCount ?? 0) > 0 ? (
                            <div className="text-[10px] lg:text-xs text-red-400 font-mono bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              {session.errorCount} CRITICAL ERRORS
                            </div>
                          ) : null}
                          {session.hasRageClicks && (
                            <div className="flex items-center gap-1 text-[10px] lg:text-xs text-orange-400 font-mono bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20" title="Rage Clicks Detected">
                              <Flame className="w-3 h-3" /> RAGE
                            </div>
                          )}
                          {session.hasDeadClicks && (
                            <div className="flex items-center gap-1 text-[10px] lg:text-xs text-yellow-400 font-mono bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20" title="Dead Clicks Detected">
                              <MousePointerClick className="w-3 h-3" /> DEAD CLICK
                            </div>
                          )}
                          {session.hasUTurns && (
                            <div className="flex items-center gap-1 text-[10px] lg:text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20" title="U-Turns Detected">
                              <CornerUpLeft className="w-3 h-3" /> U-TURN
                            </div>
                          )}
                          {session.hasWildScrolling && (
                            <div className="flex items-center gap-1 text-[10px] lg:text-xs text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20" title="Wild Scrolling Detected">
                              <ChevronsUpDown className="w-3 h-3" /> SCROLL
                            </div>
                          )}
                          {(!(session.errorCount ?? 0) && !session.hasRageClicks && !session.hasDeadClicks && !session.hasUTurns && !session.hasWildScrolling) && (
                            <div className="text-[10px] lg:text-xs text-neutral-500 font-mono tracking-widest uppercase">
                              {session.country || 'UNKNOWN ORIGIN'}
                            </div>
                          )}
                          {projectId === 'all' && projectName && (
                            <div className="text-[10px] lg:text-xs text-neutral-400 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 ml-2">
                              {projectName}
                            </div>
                          )}
                          {((session.tags as string[]) || []).map(tag => (
                            <div key={tag} className="flex items-center text-[10px] lg:text-xs text-neutral-300 font-mono bg-white/10 px-2 py-0.5 rounded border border-white/20">
                              #{tag}
                            </div>
                          ))}
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
                                  width: `${Math.min(((dur || 0) / maxDuration) * 100, 100)}%`,
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
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--color-border-dark)] bg-black/40 relative z-10">
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono tracking-[0.1em] text-neutral-500 uppercase flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent-green)]/50" />
                Showing {Math.min(filteredCount, page * pageSize)} of {filteredCount}
              </span>
              <span className="text-xs font-mono tracking-[0.1em] text-neutral-500 uppercase">
                Sorted by Recency
              </span>
            </div>
            
            <Pagination totalCount={filteredCount} pageSize={pageSize} />
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
