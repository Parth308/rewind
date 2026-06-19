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
      { projectId: targetProjectId, type: 'client_targets', metric: 'client_targets', position: 5, config: {} },
    ] as any).returning();
  }

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {/* Header */}
      <FadeUp>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2 sm:mb-3">
              Analytics matrix.
            </h1>
            <p className="text-base sm:text-lg text-white/[0.618] max-w-2xl">
              High-level telemetry across your entire infrastructure. Monitor events, performance, and exceptions in real-time.
            </p>
          </div>
          <div id="dashboard-header-actions" className="flex items-center gap-2 sm:mt-2 shrink-0 z-50 relative"></div>
        </div>
      </FadeUp>

      {/* Dynamic Widgets Area */}
      <FadeUp delay={0.1} className="w-full">
        <DashboardWidgetGrid initialWidgets={widgets} projectId={projectId} />
      </FadeUp>

      {/* AI Usage (Full Width Bottom) */}
      <FadeUp delay={0.7} className="mt-4">
        <AiUsageCard projectId={projectId} />
      </FadeUp>
    </div>
  );
}