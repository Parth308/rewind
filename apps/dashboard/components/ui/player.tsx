// components/ui/player.tsx
// Uses rrweb core Replayer directly — NO rrweb-player (Svelte) wrapper.
// The Svelte wrapper's internal Array.from(target.childNodes) during state updates
// was the root cause of all crashes. Core Replayer has zero Svelte dependency.
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

type FrustrationDot = {
  offsetMs: number;
  type: 'rage' | 'dead' | 'uturn' | 'scroll' | 'custom';
  label: string;
};

const DOT_CFG: Record<FrustrationDot['type'], { color: string; glow: string }> = {
  rage:   { color: '#fb923c', glow: 'rgba(251,146,60,0.5)' },
  dead:   { color: '#facc15', glow: 'rgba(250,204,21,0.5)' },
  uturn:  { color: '#60a5fa', glow: 'rgba(96,165,250,0.5)' },
  scroll: { color: '#c084fc', glow: 'rgba(192,132,252,0.5)' },
  custom: { color: '#a3e635', glow: 'rgba(163,230,53,0.5)' },
};

const formatTime = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
};

export default function Player({
  events,
  frustrationDots = [],
  totalMs = 0,
  onTimeUpdate,
}: {
  events: any[];
  frustrationDots?: FrustrationDot[];
  totalMs?: number;
  onTimeUpdate?: (ms: number) => void;
}) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const progressRef    = useRef<HTMLDivElement>(null);
  const replayerRef    = useRef<any>(null);
  const viewportRef    = useRef<{ w: number; h: number } | null>(null);

  const [currentMs, setCurrentMs]   = useState(0);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [skipIdle, setSkipIdle]     = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const skipIdleRef   = useRef(skipIdle);
  const isDraggingRef = useRef(false);
  const lastSeekTime  = useRef(0);
  const durationMsRef = useRef(totalMs);

  // Recompute iframe scale whenever container resizes
  const applyScale = useCallback(() => {
    const vp = viewportRef.current;
    const container = containerRef.current;
    if (!vp || !container || !replayerRef.current) return;
    try {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw === 0 || ch === 0) return;
      const scale = Math.min(cw / vp.w, ch / vp.h);
      const wrapper = container.querySelector('.replayer-wrapper') as HTMLElement | null;
      if (wrapper) {
        wrapper.style.transform       = `scale(${scale})`;
        wrapper.style.transformOrigin = 'top left';
        wrapper.style.position        = 'absolute';
        wrapper.style.top             = `${(ch - vp.h * scale) / 2}px`;
        wrapper.style.left            = `${(cw - vp.w * scale) / 2}px`;
      }
    } catch {}
  }, []);

  useEffect(() => { skipIdleRef.current = skipIdle; }, [skipIdle]);
  useEffect(() => { durationMsRef.current = totalMs; }, [totalMs]);

  // ── safeSeek: call Replayer directly, never through Svelte wrapper ────────
  const safeSeek = useCallback((offsetMs: number, thenPlay = false) => {
    const r = replayerRef.current;
    if (!r) return;
    const ms = Math.max(0, Math.floor(offsetMs));
    try {
      if (thenPlay) {
        r.play(ms);
        setIsPlaying(true);
      } else {
        r.pause(ms);
        setIsPlaying(false);
      }
    } catch {
      // swallow all internal rrweb DOM errors silently
    }
  }, []);

  const togglePlay = useCallback(() => {
    const r = replayerRef.current;
    if (!r) return;
    try {
      const playing = r.service?.state?.matches?.('playing') ||
                      r.service?.state?.value === 'playing';
      if (playing) {
        r.pause();
        setIsPlaying(false);
      } else {
        const t = r.getCurrentTime?.() ?? 0;
        r.play(t);
        setIsPlaying(true);
      }
    } catch {}
  }, []);

  // ── Player lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !events || events.length < 2 || !containerRef.current) return;

    const container = containerRef.current;
    let destroyed = false;

    const startTime  = events[0].timestamp;
    const endTime    = events[events.length - 1].timestamp;
    const durationMs = endTime - startTime;
    durationMsRef.current = durationMs;

    // Pre-calculate idle gaps
    const IDLE_THRESHOLD = 3000;
    const idleGaps: { start: number; end: number }[] = [];
    let lastTs = startTime;
    for (let i = 1; i < events.length; i++) {
      if (events[i].timestamp - lastTs > IDLE_THRESHOLD) {
        idleGaps.push({
          start: (lastTs - startTime) + 500,
          end:   (events[i].timestamp - startTime) - 500,
        });
      }
      lastTs = events[i].timestamp;
    }

    // Patch iframe Node.prototype to silence rrweb internal DOM errors.
    // Called immediately after Replayer construction AND on interval in case
    // rrweb recreates the iframe on full snapshots.
    const patchIframe = (r: any) => {
      try {
        const win = r?.iframe?.contentWindow;
        if (!win?.Node) return;
        const P = win.Node.prototype as any;
        if (!P.__rw_patched) {
          P.__rw_patched = true;
          const safe = (orig: Function, fallback: (a: any) => any) =>
            function(this: any, ...a: any[]) {
              if (!a[0]) return a[0];
              try { return orig.apply(this, a); } catch { return fallback(a[0]); }
            };
          P.insertBefore  = safe(P.insertBefore,  (n: any) => n);
          P.appendChild   = safe(P.appendChild,   (n: any) => n);
          P.removeChild   = safe(P.removeChild,   (n: any) => n);
          P.replaceChild  = function(n: any, o: any) {
            if (!n || !o) return o;
            try { return Node.prototype.replaceChild.call(this, n, o); } catch { return o; }
          };
          if (!P.setAttribute)   P.setAttribute   = () => {};
          if (!P.removeAttribute) P.removeAttribute = () => {};
        }
        // Forward Space key from iframe to host
        if (!win.__rw_kb) {
          win.__rw_kb = true;
          win.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === ' ') {
              e.preventDefault(); e.stopPropagation(); togglePlay();
            }
          }, { capture: true });
        }
      } catch {}
    };

    const loadReplayer = async () => {
      const { Replayer } = await import('rrweb') as any;
      if (destroyed) return;

      const replayer = new Replayer(events, {
        root:           container,
        skipInactive:   false,
        showWarning:    false,
        mouseTail:      { duration: 500, lingeringTime: 300 },
      });

      replayerRef.current = replayer;

      // Patch immediately, then re-patch on interval in case iframe is rebuilt
      patchIframe(replayer);
      const patchInterval = setInterval(() => patchIframe(replayer), 100);

      // Handle recorded viewport size → compute CSS scale to fit container
      replayer.on('resize', (dim: { width: number; height: number }) => {
        if (destroyed || !dim) return;
        viewportRef.current = { w: dim.width, h: dim.height };
        // Set iframe to recorded dimensions, then scale the wrapper to fit container
        try {
          const iframe = replayer.iframe as HTMLIFrameElement | undefined;
          if (iframe) {
            iframe.style.width  = `${dim.width}px`;
            iframe.style.height = `${dim.height}px`;
            iframe.style.display = '';
          }
        } catch {}
        applyScale();
      });

      // Start playback
      try { replayer.play(); setIsPlaying(true); } catch {}

      // Track time via event-cast (high-frequency, most accurate)
      replayer.on('event-cast', (ev: any) => {
        if (destroyed || isDraggingRef.current || !ev?.timestamp) return;
        const ms = ev.timestamp - startTime;
        if (ms >= 0) { setCurrentMs(ms); onTimeUpdate?.(ms); }
      });

      // Track play/pause state changes
      replayer.on('state-change', (states: any) => {
        if (destroyed) return;
        setIsPlaying(states?.player?.value === 'playing');
      });

      replayer.on('finish', () => { if (!destroyed) setIsPlaying(false); });

      // Poll fallback + idle skip (250ms)
      const poll = setInterval(() => {
        if (destroyed || isDraggingRef.current || !replayerRef.current) return;
        try {
          const t = replayerRef.current.getCurrentTime?.();
          if (typeof t !== 'number' || t < 0) return;
          setCurrentMs(t); onTimeUpdate?.(t);

          if (skipIdleRef.current && Date.now() - lastSeekTime.current > 500) {
            const gap = idleGaps.find(g => t >= g.start && t < g.end);
            if (gap) {
              lastSeekTime.current = Date.now();
              try { replayerRef.current.play(Math.floor(gap.end)); setIsPlaying(true); } catch {}
            }
          }
        } catch {}
      }, 250);

      // Reapply scale when container is resized
      const ro = new ResizeObserver(applyScale);
      ro.observe(container);

      return () => {
        clearInterval(patchInterval);
        clearInterval(poll);
        ro.disconnect();
      };
    };

    let cleanup: (() => void) | undefined;
    loadReplayer().then(fn => { cleanup = fn; });

    // Keyboard shortcut — host window
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault(); e.stopPropagation(); togglePlay();
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });

    return () => {
      destroyed = true;
      cleanup?.();
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      try { replayerRef.current?.pause?.(); } catch {}
      try { replayerRef.current?.destroy?.(); } catch {}
      container.innerHTML = '';
      replayerRef.current = null;
      setIsPlaying(false);
      setCurrentMs(0);
    };
  }, [events, onTimeUpdate, togglePlay]);

  // ── Custom progress bar drag-to-seek ────────────────────────────────────
  const handleProgressPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !progressRef.current || !replayerRef.current) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    isDraggingRef.current = true;
    lastSeekTime.current  = Date.now();

    const dur = durationMsRef.current;
    let wasPlaying = false;

    try {
      const r = replayerRef.current;
      wasPlaying = r.service?.state?.matches?.('playing') ||
                   r.service?.state?.value === 'playing' || false;
      if (wasPlaying) { r.pause(); setIsPlaying(false); }
    } catch {}

    const getTime = (clientX: number) => {
      const rect = progressRef.current!.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return pct * dur;
    };

    setCurrentMs(getTime(e.clientX));

    const onMove = (me: PointerEvent) => {
      if (!isDraggingRef.current) return;
      setCurrentMs(getTime(me.clientX));
    };

    const onUp = (me: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
      lastSeekTime.current = Date.now();
      safeSeek(getTime(me.clientX), wasPlaying);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
  }, [safeSeek]);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!events || events.length < 2) {
    return (
      <div className="flex h-full w-full items-center justify-center flex-col gap-4">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center"
             style={{ background: 'rgba(163,230,53,0.06)', border: '1px solid rgba(163,230,53,0.12)' }}>
          <svg className="h-6 w-6" style={{ color: 'rgba(163,230,53,0.4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-400 mb-1">No recording data</p>
          <p className="text-xs text-neutral-600 font-mono">Not enough events to replay</p>
        </div>
      </div>
    );
  }

  const recordedUrl = events[0]?.data?.href ?? 'https://your-app.com';
  const dur = durationMsRef.current || totalMs;
  const pct = dur > 0 ? Math.min(100, (currentMs / dur) * 100) : 0;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden rounded-2xl"
         style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* ── Browser Chrome header ── */}
      <div className="flex items-center gap-3 px-5 py-3.5 shrink-0 browser-chrome"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ background: '#FF5F56', boxShadow: '0 0 6px rgba(255,95,86,0.5)' }} />
          <div className="h-3 w-3 rounded-full" style={{ background: '#FFBD2E', boxShadow: '0 0 6px rgba(255,189,46,0.4)' }} />
          <div className="h-3 w-3 rounded-full" style={{ background: '#27C93F', boxShadow: '0 0 6px rgba(39,201,63,0.4)' }} />
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg max-w-md overflow-hidden"
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <svg className="h-3 w-3 shrink-0" style={{ color: '#a3e635', opacity: 0.6 }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="truncate text-xs text-neutral-500 font-mono">{recordedUrl}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <button onClick={() => setSkipIdle(s => !s)} title="Skip periods of inactivity"
            className={`mr-3 flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono tracking-widest uppercase transition-colors ${
              skipIdle
                ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] border border-[var(--color-accent-green)]/30'
                : 'bg-white/5 text-neutral-500 hover:text-white border border-white/10'
            }`}>
            {skipIdle ? 'SKIP IDLE: ON' : 'SKIP IDLE: OFF'}
          </button>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono"
               style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }}>Space</kbd>
          <span className="text-[10px] text-neutral-700">to play/pause</span>
        </div>
      </div>

      {/* ── Replay area (rrweb injects its iframe here) ── */}
      <div className="flex-1 min-h-0 relative overflow-hidden" style={{ background: '#080808' }}>
        <div ref={containerRef} className="w-full h-full" />

        {/* Click-to-toggle overlay */}
        <div className="absolute inset-0 cursor-pointer" style={{ zIndex: 5 }} onClick={togglePlay} />
      </div>

      {/* ── Custom controls (replaces rrweb-player Svelte UI entirely) ── */}
      <div className="shrink-0 px-4 pb-3 pt-2"
           style={{ background: '#111', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Progress bar */}
        <div ref={progressRef} onPointerDown={handleProgressPointerDown}
             className="relative h-1.5 rounded-full cursor-pointer mb-2.5"
             style={{ background: 'rgba(255,255,255,0.1)', touchAction: 'none' }}>
          <div className="absolute inset-y-0 left-0 rounded-full"
               style={{ width: `${pct}%`, background: '#a3e635',
                 transition: isDraggingRef.current ? 'none' : 'width 0.15s linear' }} />
          {/* Scrubber handle */}
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
               style={{ left: `${pct}%`, transform: 'translate(-50%, -50%)',
                 background: '#a3e635', boxShadow: '0 0 0 2px rgba(163,230,53,0.3)',
                 transition: isDraggingRef.current ? 'none' : 'left 0.15s linear' }} />

          {/* Frustration dots (aligned to scrubber track) */}
          {frustrationDots.length > 0 && dur > 0 && (
            <div className="absolute pointer-events-none" style={{ top: '50%', left: 0, right: 0, height: 0 }}>
              {frustrationDots.map((dot, i) => {
                const cfg    = DOT_CFG[dot.type];
                const dotPct = Math.min((dot.offsetMs / dur) * 100, 100);
                const isHov  = hoveredIdx === i;
                const s      = Math.floor(dot.offsetMs / 1000);
                const time   = s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
                return (
                  <div key={i} style={{ position: 'absolute', left: `${dotPct}%`, top: '0px',
                    transform: 'translate(-50%, -50%)', pointerEvents: 'auto', zIndex: 50 }}>
                    {isHov && (
                      <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                        background: '#1a1a1a', border: `1px solid ${cfg.color}50`, borderRadius: '8px',
                        padding: '5px 10px', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 100,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: cfg.color }}>{dot.label}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4b5563' }}>· {time}</span>
                      </div>
                    )}
                    <button
                      onClick={ev => { ev.stopPropagation(); safeSeek(dot.offsetMs, true); }}
                      onPointerDown={ev => ev.stopPropagation()}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      style={{ width: isHov ? '14px' : '10px', height: isHov ? '14px' : '10px',
                        borderRadius: '50%', background: cfg.color,
                        boxShadow: isHov ? `0 0 0 3px ${cfg.glow}, 0 0 16px ${cfg.glow}` : `0 0 8px ${cfg.glow}`,
                        border: `2px solid ${isHov ? '#fff' : cfg.color}`,
                        cursor: 'pointer', padding: 0, transition: 'all 0.15s ease', display: 'block' }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play / Pause button */}
            <button onClick={togglePlay}
                    className="flex items-center justify-center w-7 h-7 rounded-full transition-colors"
                    style={{ background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.2)' }}>
              {isPlaying ? (
                <svg width="10" height="12" viewBox="0 0 10 12" fill="#a3e635">
                  <rect x="0" y="0" width="3.5" height="12" rx="1" />
                  <rect x="6.5" y="0" width="3.5" height="12" rx="1" />
                </svg>
              ) : (
                <svg width="10" height="12" viewBox="0 0 10 12" fill="#a3e635">
                  <path d="M0 0 L10 6 L0 12 Z" />
                </svg>
              )}
            </button>

            {/* Time display */}
            <div className="px-2.5 py-1 rounded-md font-mono text-[10px] tracking-wider flex items-center gap-1.5"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-white font-bold">{formatTime(currentMs)}</span>
              <span className="text-neutral-600">/</span>
              <span className="text-neutral-500">{formatTime(dur)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}