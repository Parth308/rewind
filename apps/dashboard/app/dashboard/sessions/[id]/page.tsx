import Link from 'next/link';
import Player from '@/components/ui/player';
import { db } from '@/lib/db';
import { events, sessions, consoleLogs, networkRequests, errors } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { formatDistanceToNow } from 'date-fns';
import { FadeUp } from '@/components/ui/fade-up';
import { ArrowLeft, Terminal, Activity, Monitor } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SessionReplay(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const sessionList = await db.select().from(sessions).where(eq(sessions.id, params.id));
  const session = sessionList[0] || null;

  const dbEvents = await db.select().from(events).where(eq(events.sessionId, params.id)).orderBy(events.timestamp);
  const rrwebEvents = dbEvents.map(e => e.data);

  const logs = await db.select().from(consoleLogs).where(eq(consoleLogs.sessionId, params.id)).orderBy(consoleLogs.timestamp);
  const network = await db.select().from(networkRequests).where(eq(networkRequests.sessionId, params.id)).orderBy(networkRequests.timestamp);

  if (!session) return (
    <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
      <div className="font-mono text-neutral-600 text-sm border border-neutral-800 bg-[#111] p-6 rounded-xl">Session Reference Not Found</div>
      <Link href="/dashboard" className="text-xs font-mono text-neutral-500 hover:text-white transition-colors flex items-center gap-2">
        <ArrowLeft className="w-3 h-3" /> Return to Sessions
      </Link>
    </div>
  );

  const durStr = session.durationMs
    ? session.durationMs >= 60000
      ? `${Math.floor(session.durationMs / 60000)}m ${Math.round((session.durationMs % 60000) / 1000)}s`
      : `${Math.round(session.durationMs / 1000)}s`
    : null;

  return (
    <div className="flex flex-col gap-6" style={{ height: 'calc(100vh - 7rem)' }}>

      {/* Top Bar */}
      <FadeUp>
        <div className="flex items-center justify-between p-6 bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl relative overflow-hidden shadow-xl shrink-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-50" />
          
          <div className="flex items-center gap-6 relative z-10">
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-neutral-400 hover:text-white shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            <div className="h-8 w-px bg-[var(--color-border-dark)]" />
            
            <div>
              <div className="font-mono text-lg text-white font-bold tracking-wider">
                {params.id}
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 mt-1 uppercase tracking-widest">
                {session.os && <span className="text-[var(--color-accent-green)]">{session.os}</span>}
                {session.browser && <span>{session.browser}</span>}
                {durStr && <span className="text-indigo-400">{durStr} DURATION</span>}
                {session.startedAt && (
                  <span>{formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="relative z-10 flex items-center gap-3 bg-[#111] border border-[var(--color-border-dark)] px-4 py-2 rounded-lg">
            <div className="relative flex h-2 w-2">
              <span className="animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-green)] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent-green)] shadow-[0_0_8px_var(--color-accent-green)]" />
            </div>
            <span className="text-[10px] font-mono tracking-[0.2em] text-[var(--color-accent-green)] font-bold uppercase">Captured</span>
          </div>
        </div>
      </FadeUp>

      {/* Main Content */}
      <FadeUp delay={0.1} className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0 overflow-y-auto xl:overflow-hidden">

        {/* Player Area */}
        <div className="flex-1 min-h-[400px] xl:min-h-0 flex flex-col rounded-2xl border border-[var(--color-border-dark)] bg-[#050505] overflow-hidden relative shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3 bg-[#111] border-b border-[var(--color-border-dark)] relative z-10 shrink-0">
            <Monitor className="w-4 h-4 text-neutral-500" />
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Viewport Reproduction</span>
          </div>
          
          <div className="flex-1 relative z-10 overflow-hidden">
            {rrwebEvents.length > 0 ? (
              <Player events={rrwebEvents} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]">
                <div className="w-16 h-16 rounded-2xl border border-[var(--color-border-dark)] bg-[#111] flex items-center justify-center text-neutral-600 shadow-inner">
                  <Monitor className="w-8 h-8 opacity-50" />
                </div>
                <span className="font-mono text-xs tracking-widest uppercase text-neutral-600">No DOM Mutations Recorded</span>
              </div>
            )}
          </div>
        </div>

        {/* Right panel (Logs & Network) */}
        <div className="w-full xl:w-[400px] shrink-0 flex flex-col gap-6 min-h-[600px] xl:min-h-0">

          {/* Console */}
          <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-[var(--color-border-dark)] bg-[#0A0A0A] overflow-hidden shadow-2xl relative">
            <div className="absolute right-0 top-0 w-48 h-48 bg-purple-500/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between px-5 py-3 bg-[#111] border-b border-[var(--color-border-dark)] relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono text-neutral-400 tracking-widest uppercase">Console Stream</span>
              </div>
              <span className="text-[10px] font-mono text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{logs.length} EVENTS</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 relative z-10">
              {logs.length === 0 ? (
                <div className="text-neutral-700 text-center py-10 uppercase tracking-widest text-[10px]">Empty Buffer</div>
              ) : logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex gap-3 py-2 px-3 rounded-lg border ${
                    log.level === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 
                    log.level === 'warn' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 
                    'bg-white/[0.02] border-white/5 text-neutral-400'
                  }`}
                >
                  <span className="opacity-50 shrink-0 tabular-nums text-[10px] mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="break-all leading-relaxed">{log.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Network */}
          <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-[var(--color-border-dark)] bg-[#0A0A0A] overflow-hidden shadow-2xl relative">
            <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between px-5 py-3 bg-[#111] border-b border-[var(--color-border-dark)] relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono text-neutral-400 tracking-widest uppercase">Network Requests</span>
              </div>
              <span className="text-[10px] font-mono text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{network.length} REQS</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1 relative z-10">
              {network.length === 0 ? (
                <div className="text-neutral-700 text-center py-10 uppercase tracking-widest text-[10px]">No Network Traffic</div>
              ) : network.map((req) => {
                const status = req.status || 200;
                const isErr = status >= 400;
                return (
                  <div key={req.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/[0.03] transition-colors group" title={req.url}>
                    <span
                      className="shrink-0 font-bold tracking-wider px-1.5 py-0.5 rounded uppercase"
                      style={{
                        background: isErr ? 'rgba(239,68,68,0.1)' : 'rgba(163,230,53,0.1)',
                        color: isErr ? '#f87171' : '#a3e635',
                        border: `1px solid ${isErr ? 'rgba(239,68,68,0.2)' : 'rgba(163,230,53,0.2)'}`,
                      }}
                    >
                      {req.method}
                    </span>
                    <span
                      className="shrink-0 tabular-nums"
                      style={{ color: isErr ? '#f87171' : '#6b7280' }}
                    >
                      {status}
                    </span>
                    <span className="truncate text-neutral-500 group-hover:text-neutral-300 transition-colors flex-1">
                      {req.url}
                    </span>
                    {req.duration != null && (
                      <span className="shrink-0 text-neutral-600 tabular-nums group-hover:text-neutral-400">{req.duration}ms</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </FadeUp>
    </div>
  );
}
