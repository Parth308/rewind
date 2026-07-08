import { db } from '@/lib/db';
import { aiUsageLogs } from '@rewind/shared';
import { eq, sql } from 'drizzle-orm';
import { BarChart3, BrainCircuit } from 'lucide-react';

// --------------- Shared UI ---------------
const providerColor: Record<string, string> = {
  google: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]',
  openai: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  anthropic: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]',
};

const providerBadge: Record<string, string> = {
  google: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  openai: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  anthropic: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
};

function AiUsageCardUI({
  totalTokens,
  totalCalls,
  modelRows,
  providerCount,
}: {
  totalTokens: number;
  totalCalls: number;
  modelRows: { model: string; provider: string; totalTokens: number; calls: number }[];
  providerCount?: number;
}) {
  const providers = providerCount ?? new Set(modelRows.map(r => r.provider)).size;

  return (
    <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-8 relative overflow-hidden group">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-0 -mt-24 -mr-24 w-64 h-64 bg-purple-500 opacity-[0.02] blur-[80px] rounded-full pointer-events-none" />

      <h3 className="font-sans text-2xl font-bold text-white mb-8 relative z-10 flex items-center gap-3">
        <BrainCircuit className="w-5 h-5 text-purple-400" /> AI Usage &amp; Token Ledger
      </h3>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 relative z-10">
        {[
          { label: 'TOTAL TOKENS', value: totalTokens.toLocaleString(), color: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.1)]' },
          { label: 'API CALLS', value: totalCalls.toLocaleString(), color: 'text-neutral-300', border: 'border-neutral-700', glow: '' },
          { label: 'MODELS USED', value: modelRows.length.toString(), color: 'text-neutral-300', border: 'border-neutral-700', glow: '' },
          { label: 'PROVIDERS', value: providers.toString(), color: 'text-neutral-300', border: 'border-neutral-700', glow: '' },
        ].map((stat, i) => (
          <div key={i} className={`bg-[#111] rounded-xl p-5 border ${stat.border} ${stat.glow} relative overflow-hidden`}>
            <div className={`text-[10px] font-mono tracking-[0.2em] mb-3 ${stat.color} opacity-70`}>{stat.label}</div>
            <div className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Per-model breakdown */}
      <div className="relative z-10 space-y-3">
        {modelRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BarChart3 className="w-10 h-10 text-neutral-700 mb-4" />
            <p className="text-sm font-mono text-neutral-600">No AI usage recorded yet.</p>
            <p className="text-xs font-mono text-neutral-700 mt-1">Token usage appears here once sessions are embedded or searched.</p>
          </div>
        ) : (
          modelRows.map((row) => {
            const pct = totalTokens > 0 ? (row.totalTokens / totalTokens) * 100 : 0;
            return (
              <div key={row.model} className="flex items-center gap-4 p-4 bg-[#111] rounded-xl border border-[var(--color-border-dark)] hover:border-neutral-600 transition-colors">
                <div className={`w-2 h-8 rounded-full shrink-0 ${providerColor[row.provider] || 'bg-neutral-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-sm font-mono text-white truncate">{row.model}</span>
                    <span className={`text-[9px] font-mono border rounded px-1.5 py-0.5 uppercase tracking-wider ${providerBadge[row.provider] || 'text-neutral-500 border-neutral-700'}`}>
                      {row.provider}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${providerColor[row.provider]?.split(' ')[0] || 'bg-neutral-600'} transition-all duration-1000`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-mono text-white">{row.totalTokens.toLocaleString()} tokens</div>
                  <div className="text-[10px] font-mono text-neutral-500">{row.calls} call{Number(row.calls) !== 1 ? 's' : ''}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="text-[10px] font-mono text-neutral-700 mt-6 relative z-10">
        ⓘ Token counts reflect usage logged by Rewind. Actual API billing quotas are managed per-provider on their respective dashboards. This is a relative usage tracker, not a quota enforcer.
      </p>
    </div>
  );
}

// --------------- Main export ---------------
export async function AiUsageCard({ projectId }: { projectId: string }) {
  // --- Demo Mode ---
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    const demoRows = [
      { model: 'gemini-1.5-flash', provider: 'google', totalTokens: 1284300, calls: 3412 },
      { model: 'text-embedding-3-small', provider: 'openai', totalTokens: 876200, calls: 12840 },
      { model: 'claude-3-haiku-20240307', provider: 'anthropic', totalTokens: 421500, calls: 1870 },
    ];
    const totalTokens = demoRows.reduce((s, r) => s + r.totalTokens, 0);
    const totalCalls = demoRows.reduce((s, r) => s + r.calls, 0);
    return <AiUsageCardUI totalTokens={totalTokens} totalCalls={totalCalls} modelRows={demoRows} providerCount={3} />;
  }
  // -----------------

  // Per-model usage breakdown
  const usageData = await db
    .select({
      model: aiUsageLogs.model,
      provider: aiUsageLogs.provider,
      action: aiUsageLogs.action,
      totalTokens: sql<number>`sum(${aiUsageLogs.totalTokens})`,
      promptTokens: sql<number>`sum(${aiUsageLogs.promptTokens})`,
      completionTokens: sql<number>`sum(${aiUsageLogs.completionTokens})`,
      calls: sql<number>`count(*)`,
    })
    .from(aiUsageLogs)
    .where(projectId !== 'all' ? eq(aiUsageLogs.projectId, projectId) : undefined)
    .groupBy(aiUsageLogs.model, aiUsageLogs.provider, aiUsageLogs.action)
    .orderBy(sql`sum(${aiUsageLogs.totalTokens}) desc`);

  const totalTokens = usageData.reduce((s, r) => s + Number(r.totalTokens), 0);
  const totalCalls = usageData.reduce((s, r) => s + Number(r.calls), 0);

  // Collapse by model (aggregate across actions)
  const byModel = new Map<string, { model: string; provider: string; totalTokens: number; calls: number }>();
  for (const row of usageData) {
    const key = row.model;
    if (!byModel.has(key)) byModel.set(key, { model: row.model, provider: row.provider, totalTokens: 0, calls: 0 });
    const existing = byModel.get(key)!;
    existing.totalTokens += Number(row.totalTokens);
    existing.calls += Number(row.calls);
  }
  const modelRows = Array.from(byModel.values()).sort((a, b) => b.totalTokens - a.totalTokens);

  return (
    <AiUsageCardUI
      totalTokens={totalTokens}
      totalCalls={totalCalls}
      modelRows={modelRows}
      providerCount={new Set(usageData.map(r => r.provider)).size}
    />
  );
}
