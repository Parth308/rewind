import { db } from '@/lib/db';
import { sessions, events, networkRequests, errors } from '@rewind/shared';
import { count, sql, eq, asc, isNull } from 'drizzle-orm';
import { dashboardWidgets } from '@rewind/shared';
import { FadeUp } from '@/components/ui/fade-up';
import { AiUsageCard } from './AiUsageCard';
import { DashboardWidgetGrid } from './DashboardWidgetGrid';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function DashboardAnalytics() {
  const cookieStore = await cookies();
  const projectId = cookieStore.get('rewind_active_project')?.value || 'all';

  let widgets: any[] = [];
  const targetProjectId = projectId === 'all' ? null : projectId;
  
  widgets = await db.select().from(dashboardWidgets)
    .where(targetProjectId === null ? isNull(dashboardWidgets.projectId) : eq(dashboardWidgets.projectId, targetProjectId))
    .orderBy(asc(dashboardWidgets.position));

  if (widgets.length === 0) {
    // Seed default widgets
    widgets = await db.insert(dashboardWidgets).values([
      { projectId: targetProjectId, type: 'stat_card', metric: 'sessions', position: 0, config: { title: 'Total Sessions', color: '#ffffff' } },
      { projectId: targetProjectId, type: 'stat_card', metric: 'events', position: 1, config: { title: 'DOM Events', color: '#a3e635' } },
      { projectId: targetProjectId, type: 'stat_card', metric: 'network', position: 2, config: { title: 'Network Reqs', color: '#818cf8' } },
      { projectId: targetProjectId, type: 'stat_card', metric: 'errors', position: 3, config: { title: 'Exceptions', color: '#f87171' } },
      { projectId: targetProjectId, type: 'line_chart', metric: 'sessions', position: 4, config: { title: 'Session Velocity', color: '#a3e635' } },
    ] as any).returning();
  }

  const browserStatsRaw = await db.execute(sql`
    SELECT browser, count(*) as count FROM sessions
    WHERE browser IS NOT NULL 
    ${projectId !== 'all' ? sql`AND project_id = ${projectId}` : sql``}
    GROUP BY browser ORDER BY count DESC LIMIT 5
  `);
  const browserStats = browserStatsRaw.rows as { browser: string; count: string }[];
  const totalBrowserCount = browserStats.reduce((sum, b) => sum + parseInt(b.count), 0);

  const avgDurationRaw = await db.execute(sql`
    SELECT AVG(duration_ms) as avg_ms FROM sessions WHERE duration_ms IS NOT NULL
    ${projectId !== 'all' ? sql`AND project_id = ${projectId}` : sql``}
  `);
  const avgMs = avgDurationRaw.rows[0]?.avg_ms
    ? Math.round(Number(avgDurationRaw.rows[0].avg_ms) / 1000)
    : null;

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {/* Header */}
      <FadeUp>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2 sm:mb-3">
              Analytics matrix.
            </h1>
            <p className="text-base sm:text-lg text-white/[0.618] max-w-2xl">
              High-level telemetry across your entire infrastructure. Monitor events, performance, and exceptions in real-time.
            </p>
          </div>
          <div id="dashboard-header-actions" className="flex items-center gap-2 sm:mt-2 shrink-0 z-50 relative"></div>
        </div>
      </FadeUp>

      {/* Charts + Browser breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Dynamic Widgets Area */}
        <FadeUp delay={0.1} className="lg:col-span-2">
          <DashboardWidgetGrid initialWidgets={widgets} projectId={projectId} />
        </FadeUp>

        {/* Browser breakdown & Avg Duration */}
        <FadeUp delay={0.6} className="h-full">
          <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden h-full min-h-[300px]">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500 opacity-5 blur-[100px] rounded-full pointer-events-none" />
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 relative z-10">Client Targets</h3>
            <p className="text-xs sm:text-sm font-mono text-neutral-500 mb-6 sm:mb-8 relative z-10">TOP BROWSERS</p>

            <div className="space-y-4 sm:space-y-6 relative z-10 flex-1">
              {browserStats.length === 0 ? (
                <div className="text-sm font-mono text-neutral-600">No browser data yet...</div>
              ) : browserStats.map((b, i) => {
                const pct = Math.round((parseInt(b.count) / totalBrowserCount) * 100);
                const colors = ['bg-[var(--color-accent-green)]', 'bg-indigo-400', 'bg-purple-400', 'bg-rose-400', 'bg-amber-400'];
                return (
                  <div key={b.browser} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm text-neutral-300 font-medium group-hover:text-white transition-colors truncate mr-2">{b.browser}</span>
                      <span className="text-xs font-mono text-neutral-500 shrink-0">{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${pct}%`, opacity: 0.8 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {avgMs !== null && (
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[var(--color-border-dark)] relative z-10">
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em] mb-2">Avg Session Duration</div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-baseline gap-1">
                  {avgMs}<span className="text-sm text-neutral-600 font-normal">s</span>
                </div>
              </div>
            )}
          </div>
        </FadeUp>
      </div>

      {/* AI Usage (Full Width Bottom) */}
      <FadeUp delay={0.7} className="mt-4">
        <AiUsageCard projectId={projectId} />
      </FadeUp>
    </div>
  );
}