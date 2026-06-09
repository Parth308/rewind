'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Player from '@/components/ui/player';
import { Terminal, Activity } from 'lucide-react';

type FrustrationDot = {
  offsetMs: number;
  type: 'rage' | 'dead' | 'uturn' | 'scroll' | 'custom';
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

type CustomEventEntry = {
  id: string;
  timestamp: number;
  name: string;
  payload: any;
};

export function SessionContent({
  rrwebEvents,
  frustrationDots,
  totalMs,
  sessionStartTime,
  logs,
  network,
  customEvents = [],
}: {
  rrwebEvents: any[];
  frustrationDots: FrustrationDot[];
  totalMs: number;
  sessionStartTime: number;
  logs: LogEntry[];
  network: NetworkEntry[];
  customEvents: CustomEventEntry[];
}) {
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [activeTab, setActiveTab] = useState<'events' | 'console' | 'network'>('events');
  const isPlayingRef = useRef(false);

  // Refs to the scroll containers
  const eventsRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);

  // Track whether the user manually scrolled (suppress auto-scroll until next play/seek)
  const eventsManual = useRef(false);
  const consoleManual = useRef(false);
  const networkManual = useRef(false);

  // Auto-scroll logic: called whenever currentTimeMs changes
  useEffect(() => {
    if (!isPlayingRef.current) return;

    const wallTime = sessionStartTime + currentTimeMs;

    // Events
    if (activeTab === 'events' && !eventsManual.current && eventsRef.current) {
      const rows = eventsRef.current.querySelectorAll<HTMLElement>('[data-ts]');
      let target: HTMLElement | null = null;
      for (const row of rows) {
        if (Number(row.dataset.ts) <= wallTime) target = row;
        else break;
      }
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Console
    if (activeTab === 'console' && !consoleManual.current && consoleRef.current) {
      const rows = consoleRef.current.querySelectorAll<HTMLElement>('[data-ts]');
      let target: HTMLElement | null = null;
      for (const row of rows) {
        if (Number(row.dataset.ts) <= wallTime) target = row;
        else break;
      }
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Network
    if (activeTab === 'network' && !networkManual.current && networkRef.current) {
      const rows = networkRef.current.querySelectorAll<HTMLElement>('[data-ts]');
      let target: HTMLElement | null = null;
      for (const row of rows) {
        if (Number(row.dataset.ts) <= wallTime) target = row;
        else break;
      }
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentTimeMs, sessionStartTime, activeTab]);

  const handleTimeUpdate = useCallback((ms: number) => {
    isPlayingRef.current = true;
    setCurrentTimeMs(ms);
  }, []);

  // Reset manual-scroll suppression on seek (dot click triggers play)
  const handleSeek = useCallback(() => {
    eventsManual.current = false;
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

      {/* Right panel (Tabbed UI) */}
      <div className="w-full xl:w-[400px] shrink-0 flex flex-col min-h-[600px] xl:min-h-0 rounded-2xl border border-[var(--color-border-dark)] bg-[#0A0A0A] overflow-hidden shadow-2xl relative">
        
        {/* Tab Headers */}
        <div className="flex items-center border-b border-[var(--color-border-dark)] bg-[#050505] shrink-0 overflow-x-auto scrollbar-hide px-2">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-3.5 text-[10px] font-mono tracking-widest uppercase transition-colors relative whitespace-nowrap ${
              activeTab === 'events' ? 'text-[var(--color-accent-green)] font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {activeTab === 'events' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent-green)] shadow-[0_0_8px_rgba(163,230,53,0.5)]" />}
            Events <span className="ml-1 opacity-50">({customEvents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`px-4 py-3.5 text-[10px] font-mono tracking-widest uppercase transition-colors relative whitespace-nowrap ${
              activeTab === 'console' ? 'text-purple-400 font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {activeTab === 'console' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
            Console <span className="ml-1 opacity-50">({logs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`px-4 py-3.5 text-[10px] font-mono tracking-widest uppercase transition-colors relative whitespace-nowrap ${
              activeTab === 'network' ? 'text-blue-400 font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {activeTab === 'network' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
            Network <span className="ml-1 opacity-50">({network.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 relative">
          
          {/* Custom Events Tab */}
          <div className={`absolute inset-0 flex flex-col ${activeTab === 'events' ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
            <div className="absolute right-0 top-0 w-48 h-48 bg-[var(--color-accent-green)]/5 blur-[50px] rounded-full pointer-events-none" />
            <div
              ref={eventsRef}
              className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-3 relative z-10"
              onScroll={() => { eventsManual.current = true; }}
            >
              {customEvents.length === 0 ? (
                <div className="text-neutral-700 text-center py-10 uppercase tracking-widest text-[10px]">No Custom Events</div>
              ) : customEvents.map((ev) => {
                const isPast = ev.timestamp <= wallTime;
                return (
                  <div
                    key={ev.id}
                    data-ts={ev.timestamp}
                    className={`p-3 rounded-lg border transition-all bg-[var(--color-accent-green)]/5 border-[var(--color-accent-green)]/20 text-neutral-300 ${isPast ? '' : 'opacity-25'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[var(--color-accent-green)] tracking-wide">{ev.name}</span>
                      <span className="opacity-50 shrink-0 tabular-nums text-[10px]">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    {Object.keys(ev.payload).length > 0 && (
                      <div className="bg-black/50 p-2 rounded border border-white/5 text-[10px] text-neutral-400 overflow-x-auto whitespace-pre">
                        {JSON.stringify(ev.payload, null, 2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Console Tab */}
          <div className={`absolute inset-0 flex flex-col ${activeTab === 'console' ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
            <div className="absolute right-0 top-0 w-48 h-48 bg-purple-500/5 blur-[50px] rounded-full pointer-events-none" />
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

          {/* Network Tab */}
          <div className={`absolute inset-0 flex flex-col ${activeTab === 'network' ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
            <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
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
    </div>
  );
}
