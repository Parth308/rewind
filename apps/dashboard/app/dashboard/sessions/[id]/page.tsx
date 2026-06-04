import Link from 'next/link';
import Player from '@/components/ui/player';
import { db } from '@/lib/db';
import { events, sessions, consoleLogs, networkRequests, errors } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { ChevronLeft, Monitor, Activity, ShieldAlert, Network, Terminal, Globe, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function SessionReplay(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  const sessionList = await db.select().from(sessions).where(eq(sessions.id, params.id));
  const session = sessionList[0] || null;

  const dbEvents = await db.select().from(events).where(eq(events.sessionId, params.id)).orderBy(events.timestamp);
  const rrwebEvents = dbEvents.map(e => e.data);

  const logs = await db.select().from(consoleLogs).where(eq(consoleLogs.sessionId, params.id)).orderBy(consoleLogs.timestamp);
  const network = await db.select().from(networkRequests).where(eq(networkRequests.sessionId, params.id)).orderBy(networkRequests.timestamp);
  const exceptions = await db.select().from(errors).where(eq(errors.sessionId, params.id)).orderBy(errors.timestamp);

  if (!session) return (
    <div className="flex h-[60vh] items-center justify-center flex-col gap-5">
      <div className="h-20 w-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <ShieldAlert className="h-10 w-10 text-red-500 opacity-80" />
      </div>
      <div className="text-center">
        <div className="font-serif text-2xl text-white font-bold mb-2">Session not found</div>
        <p className="text-neutral-500 mb-6 max-w-sm">The session you are looking for does not exist or has been deleted.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20">
          <ChevronLeft className="h-4 w-4" /> Return to sessions
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4 shrink-0">
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 shrink-0">
            <ChevronLeft className="h-5 w-5 text-neutral-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3 mb-1.5">
              Session <span className="font-mono text-sm px-2.5 py-0.5 bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/20 rounded-md text-[var(--color-accent-green)] tracking-wider">{params.id.substring(0, 8)}...</span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Monitor className="h-3.5 w-3.5 text-neutral-500" /> {session.os || 'Unknown OS'} • {session.browser || 'Unknown Browser'}
              </span>
              {session.country && (
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <Globe className="h-3.5 w-3.5 text-neutral-500" /> {session.country}
                </span>
              )}
              {session.durationMs && (
                <span className="flex items-center gap-1.5 text-neutral-300 font-mono">
                  <Clock className="h-3.5 w-3.5 text-neutral-500" /> {Math.round(session.durationMs / 1000)}s
                </span>
              )}
              <span className="text-neutral-600 border-l border-white/10 pl-4">
                {session.startedAt ? formatDistanceToNow(new Date(session.startedAt), { addSuffix: true }) : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
             </span>
             Recorded
           </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        
        {/* Left Side: Video Player */}
        <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden" style={{ minHeight: 0 }}>
          {rrwebEvents.length > 0 ? (
            <Player events={rrwebEvents} />
          ) : (
            <div className="flex h-full items-center justify-center flex-col gap-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(163,230,53,0.06)', border: '1px solid rgba(163,230,53,0.12)' }}>
                <Activity className="h-6 w-6 text-[var(--color-accent-green)] opacity-60 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-400 mb-1">Waiting for data</p>
                <span className="text-xs text-neutral-600 font-mono">Session is being recorded...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Side: Telemetry Tabs */}
        <div className="w-full lg:w-[400px] flex flex-col gap-5 min-h-0">
          
          {/* Console Logs */}
          <div className="glass rounded-2xl flex flex-col min-h-0 flex-1 border-[var(--color-border-dark)] overflow-hidden shadow-xl">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
              <Terminal className="h-4 w-4 text-[var(--color-accent-green)]" />
              <h3 className="font-serif text-sm font-bold tracking-wider text-white uppercase">Console</h3>
              <span className="ml-auto text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-md text-neutral-400">{logs.length} events</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-2.5 bg-[#050505]">
              {logs.length === 0 ? <div className="text-neutral-600 text-center py-8">No console output</div> : logs.map((log) => (
                <div key={log.id} className={`flex gap-3 pb-2.5 border-b border-white/[0.04] last:border-0 ${
                  log.level === 'error' ? 'text-red-400' : 
                  log.level === 'warn' ? 'text-yellow-400' : 
                  'text-neutral-300'
                }`}>
                  <span className="opacity-40 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  <span className="break-all leading-relaxed">{log.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Network Requests */}
          <div className="glass rounded-2xl flex flex-col min-h-0 flex-1 border-[var(--color-border-dark)] overflow-hidden shadow-xl">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
              <Network className="h-4 w-4 text-[var(--color-accent-green)]" />
              <h3 className="font-serif text-sm font-bold tracking-wider text-white uppercase">Network</h3>
              <span className="ml-auto text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-md text-neutral-400">{network.length} reqs</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-3 bg-[#050505]">
              {network.length === 0 ? <div className="text-neutral-600 text-center py-8">No network activity</div> : network.map((req) => (
                <div key={req.id} className="pb-3 border-b border-white/[0.04] last:border-0 text-neutral-400">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                      (req.status || 200) >= 400 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {req.method} {req.status || 200}
                    </span>
                    <span className="opacity-50 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {req.duration}ms
                    </span>
                  </div>
                  <div className="truncate text-neutral-300 hover:text-white transition-colors cursor-default" title={req.url}>{req.url}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
