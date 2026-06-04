import { db } from '@/lib/db';
import { sessions, events, networkRequests, errors } from '@rewind/shared';
import { count, sql } from 'drizzle-orm';
import AnalyticsCharts from './AnalyticsCharts';
import { FadeUp } from '@/components/ui/fade-up';
import { Activity, Network, ShieldAlert, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

function StatCard({ label, value, color, glowClass }: { label: string; value: string | number; color: string; glowClass: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-dark)] bg-[#0A0A0A] p-6 group transition-all duration-500 hover:border-white/20">
      <div className={`absolute top-0 right-0 -mt-12 -mr-12 w-40 h-40 opacity-10 blur-[50px] transition-opacity duration-500 group-hover:opacity-20 rounded-full ${glowClass}`} />
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:12px_12px] opacity-20" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-8">{label}</div>
        <div className={`font-mono text-3xl sm:text-4xl font-bold tabular-nums tracking-tight ${color}`}>{value}</div>
      </div>
      
      {/* Animated underline effect */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out" />
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
    <div className="flex flex-col gap-10">
      {/* Header */}
      <FadeUp>
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">Analytics matrix.</h1>
          <p className="text-lg text-neutral-400 max-w-2xl">High-level telemetry across your entire infrastructure. Monitor events, performance, and exceptions in real-time.</p>
        </div>
      </FadeUp>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FadeUp delay={0.1}><StatCard label="Total Sessions" value={totalSessions.value.toLocaleString()} color="text-white" glowClass="bg-white" /></FadeUp>
        <FadeUp delay={0.2}><StatCard label="DOM Events" value={totalEvents.value.toLocaleString()} color="text-[var(--color-accent-green)]" glowClass="bg-[var(--color-accent-green)]" /></FadeUp>
        <FadeUp delay={0.3}><StatCard label="Network Reqs" value={totalNetwork.value.toLocaleString()} color="text-indigo-400" glowClass="bg-indigo-500" /></FadeUp>
        <FadeUp delay={0.4}><StatCard label="Exceptions" value={totalErrors.value.toLocaleString()} color="text-red-400" glowClass="bg-red-500" /></FadeUp>
      </div>

      {/* Charts + Browser breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sessions over time */}
        <FadeUp delay={0.5} className="lg:col-span-2">
          <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-8 relative overflow-hidden h-full flex flex-col">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] opacity-50" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-3">
                  Session Velocity
                </h3>
                <p className="text-sm font-mono text-neutral-500 mt-2">14-DAY TRAILING COUNT</p>
              </div>
            </div>
            
            <div className="flex-1 w-full relative z-10 min-h-[250px]">
              <AnalyticsCharts data={formattedChartData} />
            </div>
          </div>
        </FadeUp>

        {/* Browser breakdown & Avg Duration */}
        <FadeUp delay={0.6} className="h-full">
          <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-8 h-full flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500 opacity-5 blur-[100px] rounded-full pointer-events-none" />

            <h3 className="font-serif text-2xl font-bold text-white mb-2 relative z-10">Client Targets</h3>
            <p className="text-sm font-mono text-neutral-500 mb-8 relative z-10">TOP BROWSERS</p>
            
            <div className="space-y-6 relative z-10 flex-1">
              {browserStats.length === 0 ? (
                <div className="text-sm font-mono text-neutral-600">No browser data yet...</div>
              ) : browserStats.map((b, i) => {
                const pct = Math.round((parseInt(b.count) / totalBrowserCount) * 100);
                const colors = ['bg-[var(--color-accent-green)]', 'bg-indigo-400', 'bg-purple-400', 'bg-rose-400', 'bg-amber-400'];
                return (
                  <div key={b.browser} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-300 font-medium group-hover:text-white transition-colors">{b.browser}</span>
                      <span className="text-xs font-mono text-neutral-500">{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[i % colors.length]}`}
                        style={{ width: `${pct}%`, opacity: 0.8 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {avgMs !== null && (
              <div className="mt-8 pt-8 border-t border-[var(--color-border-dark)] relative z-10">
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em] mb-2">Avg Session Duration</div>
                <div className="text-3xl font-mono font-bold text-white flex items-baseline gap-1">
                  {avgMs}<span className="text-sm text-neutral-600 font-normal">s</span>
                </div>
              </div>
            )}
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
