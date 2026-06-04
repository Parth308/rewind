import Link from 'next/link';
import { db } from '@/lib/db';
import { sessions, projects } from '@rewind/shared';
import { desc, count } from 'drizzle-orm';
import { Clock, ChevronRight, Video, Globe, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { OnboardingGuide } from '@/components/ui/onboarding-guide';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string | null }) {
  const s = status || 'active';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
      s === 'active'
        ? 'bg-emerald-500/15 text-emerald-400'
        : 'bg-neutral-500/15 text-neutral-400'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s === 'active' ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
      {s}
    </span>
  );
}

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
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-1">Sessions</h1>
          <p className="text-sm text-neutral-500">
            <span className="text-white font-medium">{sessionCount}</span> recorded sessions across{' '}
            <span className="text-white font-medium">{projectCount}</span>{' '}
            {projectCount === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select className="glass rounded-lg px-3 py-2 text-sm text-neutral-300 focus:border-[var(--color-accent-green)] focus:outline-none transition-colors bg-transparent">
            <option>All Projects</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="col-span-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Status</div>
          <div className="col-span-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Session</div>
          <div className="col-span-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Environment</div>
          <div className="col-span-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Duration</div>
          <div className="col-span-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Recorded</div>
          <div className="col-span-1" />
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.04]">
          {allSessions.map((session) => (
            <Link
              key={session.id}
              href={`/dashboard/sessions/${session.id}`}
              className="grid grid-cols-12 gap-4 items-center px-6 py-4 transition-colors hover:bg-white/[0.03] group"
            >
              <div className="col-span-1">
                <StatusBadge status={session.status} />
              </div>

              <div className="col-span-3 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/[0.07] transition-all group-hover:bg-[var(--color-accent-green)]/10 group-hover:border-[var(--color-accent-green)]/20">
                  <Video className="h-3.5 w-3.5 text-neutral-500 group-hover:text-[var(--color-accent-green)]" />
                </div>
                <div>
                  <div className="font-mono text-sm text-[var(--color-accent-green)] leading-none mb-1">
                    {session.id.substring(0, 12)}…
                  </div>
                  {session.country && (
                    <div className="flex items-center gap-1 text-[11px] text-neutral-600">
                      <Globe className="h-3 w-3" />{session.country}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-3">
                <div className="text-sm text-neutral-300">{session.browser || '—'}</div>
                <div className="text-xs text-neutral-600 mt-0.5">{session.os || '—'}</div>
              </div>

              <div className="col-span-2">
                {session.durationMs ? (
                  <div>
                    <div className="flex items-center gap-1.5 text-sm text-neutral-300 font-mono mb-1.5">
                      <Clock className="h-3 w-3 text-neutral-600" />
                      {session.durationMs >= 60000
                        ? `${Math.floor(session.durationMs / 60000)}m ${Math.round((session.durationMs % 60000) / 1000)}s`
                        : `${Math.round(session.durationMs / 1000)}s`}
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-accent-green)]/40 rounded-full"
                        style={{ width: `${Math.min((session.durationMs / 300000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-neutral-600">—</span>
                )}
              </div>

              <div className="col-span-2">
                <div className="text-sm text-neutral-400">
                  {session.startedAt
                    ? formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })
                    : '—'}
                </div>
                {session.errorCount && session.errorCount > 0 ? (
                  <div className="flex items-center gap-1 text-[11px] text-red-400 mt-0.5">
                    <AlertTriangle className="h-3 w-3" />
                    {session.errorCount} error{session.errorCount > 1 ? 's' : ''}
                  </div>
                ) : null}
              </div>

              <div className="col-span-1 flex justify-end">
                <ChevronRight className="h-4 w-4 text-neutral-700 group-hover:text-[var(--color-accent-green)] transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
          <span className="text-xs text-neutral-600">Showing {allSessions.length} of {sessionCount}</span>
          <span className="text-xs text-neutral-600">Sorted by most recent</span>
        </div>
      </div>
    </div>
  );
}
