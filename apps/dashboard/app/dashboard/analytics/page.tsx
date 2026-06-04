import { db } from '@/lib/db';
import { sessions, events, networkRequests, errors } from '@rewind/shared';
import { count, sql, avg } from 'drizzle-orm';
import AnalyticsCharts from './AnalyticsCharts';
import { Activity, LayoutDashboard, ShieldAlert, Network, TrendingUp, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  glow: string;
  sub?: string;
}

function StatCard({ label, value, icon: Icon, color, bg, glow, sub }: StatCardProps) {
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-6 group transition-all hover:bg-white/[0.04]">
      <div className={`absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 ${glow} opacity-[0.06] rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
      <div className="flex items-start justify-between mb-5">
        <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="font-mono text-3xl font-bold text-white mb-1 tabular-nums">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{label}</div>
      {sub && <div className="text-xs text-neutral-600 mt-1">{sub}</div>}
    </div>
  );
}

export default async function DashboardAnalytics() {
  const [totalSessions] = await db.select({ value: count() }).from(sessions);
  const [totalEvents] = await db.select({ value: count() }).from(events);
  const [totalErrors] = await db.select({ value: count() }).from(errors);
  const [totalNetwork] = await db.select({ value: count() }).from(networkRequests);

  const avgDurationRaw = await db.execute(sql`
    SELECT AVG(duration_ms) as avg_ms FROM sessions WHERE duration_ms IS NOT NULL
  `);
  const avgMs = avgDurationRaw.rows[0]?.avg_ms
    ? Math.round(Number(avgDurationRaw.rows[0].avg_ms) / 1000)
    : null;

  const sessionsByDayRaw = await db.execute(sql`
    SELECT date_trunc('day', started_at) as date, count(*) as count
    FROM sessions
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 14
  `);
  const formattedChartData = sessionsByDayRaw.rows.map((row: any) => ({
    date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sessions: parseInt(row.count, 10),
  })).reverse();

  const browserStatsRaw = await db.execute(sql`
    SELECT browser, count(*) as count
    FROM sessions
    WHERE browser IS NOT NULL
    GROUP BY browser
    ORDER BY count DESC
    LIMIT 5
  `);
  const browserStats = browserStatsRaw.rows as { browser: string; count: string }[];
  const totalBrowserCount = browserStats.reduce((sum, b) => sum + parseInt(b.count), 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-1">Analytics</h1>
        <p className="text-sm text-neutral-500">Platform-wide metrics and session trends.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sessions"
          value={totalSessions.value.toLocaleString()}
          icon={LayoutDashboard}
          color="text-[var(--color-accent-green)]"
          bg="bg-[var(--color-accent-green)]/10"
          glow="bg-[var(--color-accent-green)]"
        />
        <StatCard
          label="DOM Events"
          value={totalEvents.value.toLocaleString()}
          icon={Activity}
          color="text-blue-400"
          bg="bg-blue-500/10"
          glow="bg-blue-500"
          sub={totalSessions.value > 0 ? `~${Math.round(totalEvents.value / totalSessions.value)} per session` : undefined}
        />
        <StatCard
          label="Network Reqs"
          value={totalNetwork.value.toLocaleString()}
          icon={Network}
          color="text-purple-400"
          bg="bg-purple-500/10"
          glow="bg-purple-500"
        />
        <StatCard
          label="Exceptions"
          value={totalErrors.value.toLocaleString()}
          icon={ShieldAlert}
          color="text-red-400"
          bg="bg-red-500/10"
          glow="bg-red-500"
          sub={totalSessions.value > 0 ? `${((totalErrors.value / totalSessions.value) * 100).toFixed(1)}% session rate` : undefined}
        />
      </div>

      {/* Charts + Browser breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions over time */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--color-accent-green)]" />
                Session Trend
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Last 14 days</p>
            </div>
          </div>
          <div className="h-64 w-full relative z-10">
            <AnalyticsCharts data={formattedChartData} />
          </div>
        </div>

        {/* Browser breakdown */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-serif text-lg font-bold text-white mb-1">Browsers</h3>
          <p className="text-xs text-neutral-500 mb-6">Top clients by session count</p>
          <div className="space-y-4">
            {browserStats.length === 0 ? (
              <div className="text-sm text-neutral-600 text-center py-8">No browser data yet</div>
            ) : browserStats.map((b, i) => {
              const pct = Math.round((parseInt(b.count) / totalBrowserCount) * 100);
              const colors = ['bg-[var(--color-accent-green)]', 'bg-blue-400', 'bg-purple-400', 'bg-amber-400', 'bg-red-400'];
              return (
                <div key={b.browser}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-neutral-300 font-medium">{b.browser}</span>
                    <span className="text-xs font-mono text-neutral-500">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[i % colors.length]} opacity-70`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {avgMs !== null && (
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase tracking-widest">Avg Duration</div>
                  <div className="text-xl font-mono font-bold text-white">{avgMs}s</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
