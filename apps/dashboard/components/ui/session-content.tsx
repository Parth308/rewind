'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Player from '@/components/ui/player';
import { Terminal, Activity, X } from 'lucide-react';
import { updateSessionNotes } from '@/app/actions/session';

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
  requestBody?: string | null;
  responseBody?: string | null;
};

type CustomEventEntry = {
  id: string;
  timestamp: number;
  name: string;
  payload: any;
};

export function SessionContent({
  sessionId,
  initialTags = [],
  initialNotes = '',
  totalMs,
  logs,
  network,
}: {
  sessionId: string;
  initialTags?: string[];
  initialNotes?: string;
  totalMs: number;
  logs: LogEntry[];
  network: NetworkEntry[];
}) {
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [activeTab, setActiveTab] = useState<'events' | 'console' | 'network' | 'notes'>('events');
  const [expandedNetwork, setExpandedNetwork] = useState<Record<string, boolean>>({});
  const isPlayingRef = useRef(false);

  const [rrwebEvents, setRrwebEvents] = useState<any[]>([]);
  const [frustrationDots, setFrustrationDots] = useState<FrustrationDot[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomEventEntry[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const [tags, setTags] = useState<string[]>(initialTags);
  const [notes, setNotes] = useState<string>(initialNotes);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/events`)
      .then(res => res.json())
      .then(data => {
        const eventsArray = Array.isArray(data) ? data : [];
        setRrwebEvents(eventsArray);
        
        if (eventsArray.length > 0) {
          const startTime = eventsArray[0].timestamp;
          setSessionStartTime(startTime);
          
          const fDots: FrustrationDot[] = [];
          const cEvents: CustomEventEntry[] = [];
          const clicks: any[] = [];
          let scrollCount = 0;

          for (let i = 0; i < eventsArray.length; i++) {
            const ev = eventsArray[i];
            if (ev.type === 3 && ev.data) {
              if (ev.data.source === 2 && ev.data.type === 2) {
                clicks.push(ev);
                let isRage = false;
                const recentClicks = clicks.filter((c: any) => ev.timestamp - c.timestamp < 1000);
                if (recentClicks.length >= 3) {
                  const xs = recentClicks.map((c: any) => c.data.x);
                  const ys = recentClicks.map((c: any) => c.data.y);
                  const maxDist = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
                  if (maxDist < 50) {
                    fDots.push({ offsetMs: ev.timestamp - startTime, label: 'Rage Click', type: 'rage' });
                    clicks.length = 0;
                    isRage = true;
                  }
                }
                if (!isRage) {
                  let hasMutation = false;
                  for (let j = i + 1; j < eventsArray.length; j++) {
                    const nextEv = eventsArray[j];
                    if (nextEv.timestamp - ev.timestamp > 2000) break;
                    if (nextEv.type === 3 && nextEv.data.source === 0) { hasMutation = true; break; }
                  }
                  if (!hasMutation) {
                    fDots.push({ offsetMs: ev.timestamp - startTime, label: 'Dead Click', type: 'dead' });
                  }
                }
              }
              if (ev.data.source === 3) {
                scrollCount++;
                if (scrollCount === 21) {
                  fDots.push({ offsetMs: ev.timestamp - startTime, label: 'Wild Scrolling', type: 'scroll' });
                  scrollCount = 0;
                }
              }
            }
            if ((ev.type === 5 && ev.data?.tag === 'navigation') || ev.type === 4) {
              for (let j = i + 1; j < eventsArray.length; j++) {
                const nextEv = eventsArray[j];
                if (nextEv.timestamp - ev.timestamp > 5000) break;
                if ((nextEv.type === 5 && nextEv.data?.tag === 'navigation') || nextEv.type === 4) {
                  fDots.push({ offsetMs: nextEv.timestamp - startTime, label: 'U-Turn', type: 'uturn' });
                  break;
                }
              }
            }
            if (ev.type === 5 && ev.data && ev.data.tag && ev.data.tag !== 'navigation') {
              cEvents.push({
                id: `custom-${ev.timestamp}-${i}`,
                timestamp: ev.timestamp,
                name: ev.data.tag,
                payload: ev.data.payload || {}
              });
              fDots.push({ offsetMs: ev.timestamp - startTime, label: ev.data.tag, type: 'custom' });
            }
          }
          setFrustrationDots(fDots);
          setCustomEvents(cEvents);
        }

        setIsLoadingEvents(false);
      })
      .catch(err => {
        console.error('Failed to fetch events:', err);
        setIsLoadingEvents(false);
      });
  }, [sessionId]);

  // Refs to the scroll containers
  const eventsRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);

  // Track whether the user manually scrolled (suppress auto-scroll until next play/seek)
  const eventsManual = useRef(false);
  const consoleManual = useRef(false);
  const networkManual = useRef(false);

  // Auto-save logic
  const saveChanges = useCallback(async (newTags: string[], newNotes: string) => {
    setIsSaving(true);
    try {
      await updateSessionNotes(sessionId, newTags, newNotes);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSaving(false);
    }
  }, [sessionId]);

  const handleNotesBlur = () => {
    saveChanges(tags, notes);
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (newTag && !tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        saveChanges(newTags, notes);
      }
      e.currentTarget.value = '';
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    setTags(newTags);
    saveChanges(newTags, notes);
  };

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
          {isLoadingEvents ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]">
               <div className="w-16 h-16 rounded-2xl border border-[var(--color-border-dark)] bg-[#111] flex items-center justify-center shadow-inner">
                  <div className="w-6 h-6 border-2 border-[var(--color-accent-green)] border-t-transparent rounded-full animate-spin"></div>
               </div>
               <span className="font-mono text-xs tracking-widest uppercase text-neutral-500 animate-pulse">Loading DOM Events...</span>
            </div>
          ) : rrwebEvents.length > 0 ? (
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
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-3.5 text-[10px] font-mono tracking-widest uppercase transition-colors relative whitespace-nowrap ${
              activeTab === 'notes' ? 'text-amber-400 font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {activeTab === 'notes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
            Notes {tags.length > 0 && <span className="ml-1 opacity-50">({tags.length})</span>}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 relative">
          
          {/* Notes Tab */}
          <div className={`absolute inset-0 flex flex-col ${activeTab === 'notes' ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
            <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/5 blur-[50px] rounded-full pointer-events-none" />
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative z-10">
              
              <div>
                <div className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase mb-3 flex items-center justify-between">
                  <span>Session Tags</span>
                  {isSaving && <span className="text-amber-400 animate-pulse">Saving...</span>}
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.05] border border-white/10 text-neutral-300 font-mono text-xs">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="text-neutral-500 hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Type a tag and press Enter..."
                  onKeyDown={addTag}
                  className="w-full bg-[#111] border border-[var(--color-border-dark)] rounded-md px-3 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>

              <div className="flex-1 flex flex-col min-h-[200px]">
                <div className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase mb-3">Session Notes</div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Write observations, bugs, or notes about this session..."
                  className="flex-1 w-full resize-none bg-[#111] border border-[var(--color-border-dark)] rounded-md p-4 text-sm font-sans text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
                <div className="text-[10px] font-mono text-neutral-600 mt-2 text-right">Notes autosave when you click away</div>
              </div>

            </div>
          </div>

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
              ) : (
                <>
                  <div className="mb-4 p-3 rounded-lg border border-[var(--color-border-dark)] bg-white/[0.02] text-neutral-400">
                    <div className="flex items-start gap-2">
                      <Terminal className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="mb-1 text-[10px] uppercase tracking-widest text-white">API Payloads</p>
                        <p className="leading-relaxed">API request and response bodies are hidden by default for maximum privacy. You can explicitly opt-in to record them in your project's <a href="/dashboard/settings" className="text-[var(--color-accent-green)] hover:underline">Privacy Settings</a>.</p>
                      </div>
                    </div>
                  </div>
                  {network.map((req) => {
                    const status  = req.status || 200;
                    const isErr   = status >= 400;
                    const isPast  = req.timestamp <= wallTime;
                    const isExpanded = !!expandedNetwork[req.id];
                    const hasPayload = req.requestBody || req.responseBody;
                    return (
                      <div
                        key={req.id}
                        data-ts={req.timestamp}
                        className={`flex flex-col gap-2 py-2 px-2 rounded hover:bg-white/[0.03] transition-all group border border-transparent ${hasPayload ? 'cursor-pointer hover:border-white/10' : ''} ${isPast ? '' : 'opacity-25'}`}
                        onClick={() => hasPayload && setExpandedNetwork(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
                      >
                        <div className="flex items-center gap-3" title={req.url ?? ''}>
                          <span
                            className="shrink-0 font-bold tracking-wider px-1.5 py-0.5 rounded uppercase"
                            style={{
                              background: isErr ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                              color: isErr ? '#f87171' : '#60a5fa',
                              border: `1px solid ${isErr ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
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
                        
                        {isExpanded && hasPayload && (
                          <div className="mt-2 space-y-3 bg-black/40 p-3 rounded border border-white/5 cursor-text" onClick={e => e.stopPropagation()}>
                            {req.requestBody && (
                              <div>
                                <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Request Payload</div>
                                <div className="text-neutral-300 overflow-x-auto whitespace-pre font-mono text-[10px]">{req.requestBody}</div>
                              </div>
                            )}
                            {req.responseBody && (
                              <div>
                                <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Response Body</div>
                                <div className="text-neutral-300 overflow-x-auto whitespace-pre font-mono text-[10px]">{req.responseBody}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
