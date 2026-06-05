'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Player from '@/components/ui/player';
import { Terminal, Activity } from 'lucide-react';

type FrustrationDot = {
  offsetMs: number;
  type: 'rage' | 'dead' | 'uturn' | 'scroll';
  label: string;
};

type LogEntry = {
  id: string;
  timestamp: number;
  level: string | null;
  message: string;
};

type NetworkEntry = {
  id: string;
  timestamp: number;
  method: string | null;
  url: string | null;
  status: number | null;
  duration: number | null;
};

export function SessionContent({
  rrwebEvents,
  frustrationDots,
  totalMs,
  sessionStartTime,
  logs,
  network,
}: {
  rrwebEvents: any[];
  frustrationDots: FrustrationDot[];
  totalMs: number;
  sessionStartTime: number;
  logs: LogEntry[];
  network: NetworkEntry[];
}) {
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const isPlayingRef = useRef(false);

  // Refs to the scroll containers
  const consoleRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);

  // Track whether the user manually scrolled (suppress auto-scroll until next play/seek)
  const consoleManual = useRef(false);
  const networkManual = useRef(false);

  // Auto-scroll logic: called whenever currentTimeMs changes
  useEffect(() => {
    if (!isPlayingRef.current) return;

    const wallTime = sessionStartTime + currentTimeMs;

    // Console
    if (!consoleManual.current && consoleRef.current) {
      const rows = consoleRef.current.querySelectorAll<HTMLElement>('[data-ts]');
      let target: HTMLElement | null = null;
      for (const row of rows) {
        if (Number(row.dataset.ts) <= wallTime) target = row;
        else break;
      }
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Network
    if (!networkManual.current && networkRef.current) {
      const rows = networkRef.current.querySelectorAll<HTMLElement>('[data-ts]');
      let target: HTMLElement | null = null;
      for (const row of rows) {
        if (Number(row.dataset.ts) <= wallTime) target = row;
        else break;
      }
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentTimeMs, sessionStartTime]);

  const handleTimeUpdate = useCallback((ms: number) => {
    isPlayingRef.current = true;
    setCurrentTimeMs(ms);
  }, []);

  // Reset manual-scroll suppression on seek (dot click triggers play)
  const handleSeek = useCallback(() => {
    consoleManual.current = false;
    networkManual.current = false;
  }, []);

  const wallTime = sessionStartTime + currentTimeMs;

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full overflow-y-auto xl:overflow-hidden">

      {/* Player */}
      <div className="flex-1 min-h-[400px] xl:min-h-0 flex flex-col rounded-2xl border border-[var(--color-border-dark)] bg-[#050505] overflow-hidden relative shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-3 bg-[#111] border-b border-[var(--color-border-dark)] relative z-10 shrink-0">
          <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Viewport Reproduction</span>
        </div>
        <div className="flex-1 relative z-10 overflow-hidden">
          {rrwebEvents.length > 0 ? (
            <Player
              events={rrwebEvents}
              frustrationDots={frustrationDots}
              totalMs={totalMs}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]">
              <div className="w-16 h-16 rounded-2xl border border-[var(--color-border-dark)] bg-[#111] flex items-center justify-center text-neutral-600 shadow-inner">
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              </div>
              <span className="font-mono text-xs tracking-widest uppercase text-neutral-600">No DOM Mutations Recorded</span>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
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
          <div
            ref={consoleRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 relative z-10"
            onScroll={() => { consoleManual.current = true; }}
          >
            {logs.length === 0 ? (
              <div className="text-neutral-700 text-center py-10 uppercase tracking-widest text-[10px]">Empty Buffer</div>
            ) : logs.map((log) => {
              const isPast = log.timestamp <= wallTime;
              return (
                <div
                  key={log.id}
                  data-ts={log.timestamp}
                  className={`flex gap-3 py-2 px-3 rounded-lg border transition-all ${
                    log.level === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                    log.level === 'warn'  ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' :
                    'bg-white/[0.02] border-white/5 text-neutral-400'
                  } ${isPast ? '' : 'opacity-25'}`}
                >
                  <span className="opacity-50 shrink-0 tabular-nums text-[10px] mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="break-all leading-relaxed">{log.message}</span>
                </div>
              );
            })}
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
          <div
            ref={networkRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1 relative z-10"
            onScroll={() => { networkManual.current = true; }}
          >
            {network.length === 0 ? (
              <div className="text-neutral-700 text-center py-10 uppercase tracking-widest text-[10px]">No Network Traffic</div>
            ) : network.map((req) => {
              const status  = req.status || 200;
              const isErr   = status >= 400;
              const isPast  = req.timestamp <= wallTime;
              return (
                <div
                  key={req.id}
                  data-ts={req.timestamp}
                  className={`flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/[0.03] transition-all group ${isPast ? '' : 'opacity-25'}`}
                  title={req.url ?? ''}
                >
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
                  <span className="shrink-0 tabular-nums" style={{ color: isErr ? '#f87171' : '#6b7280' }}>{status}</span>
                  <span className="truncate text-neutral-500 group-hover:text-neutral-300 transition-colors flex-1">{req.url}</span>
                  {req.duration != null && (
                    <span className="shrink-0 text-neutral-600 tabular-nums group-hover:text-neutral-400">{req.duration}ms</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
