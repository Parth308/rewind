// components/ui/player.tsx
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

type FrustrationDot = {
  offsetMs: number;
  type: 'rage' | 'dead' | 'uturn' | 'scroll' | 'custom';
  label: string;
};

const DOT_CFG: Record<FrustrationDot['type'], { color: string; glow: string }> = {
  rage: { color: '#fb923c', glow: 'rgba(251,146,60,0.5)' },
  dead: { color: '#facc15', glow: 'rgba(250,204,21,0.5)' },
  uturn: { color: '#60a5fa', glow: 'rgba(96,165,250,0.5)' },
  scroll: { color: '#c084fc', glow: 'rgba(192,132,252,0.5)' },
  custom: { color: '#a3e635', glow: 'rgba(163,230,53,0.5)' },
};

// rrweb control bar is 80px; .rr-timeline (flex-col, space-around, row 1 of 2)
// timeline center ≈ 63px from wrapper bottom
const SCRUBBER_BOTTOM_PX = 65;

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [skipInactive, setSkipInactive] = useState(true);
  const [currentMs, setCurrentMs] = useState(0);
  const [skipIdle, setSkipIdle] = useState(true);
  const skipIdleRef = useRef(skipIdle);
  const isDraggingRef = useRef(false);
  const lastSeekTime = useRef(0);

  useEffect(() => {
    skipIdleRef.current = skipIdle;
  }, [skipIdle]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    try {
      // 1. Try native togglePlay if it exists
      if (typeof playerRef.current.togglePlay === 'function') {
        playerRef.current.togglePlay();
        return;
      }
      // 2. Try native toggle if it exists
      if (typeof playerRef.current.toggle === 'function') {
        playerRef.current.toggle();
        return;
      }
      // 3. Fallback to manual state check using the underlying xstate service
      const replayer = playerRef.current.getReplayer();
      const isPlaying = replayer?.service?.state?.matches?.('playing');
      
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    } catch (e) {
      console.warn('Failed to toggle play/pause', e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || !wrapperRef.current || events.length < 2) return;
    
    // Suppress internal rrweb DOM errors from crashing the Next.js dev overlay
    const suppressRrwebErrors = (e: ErrorEvent) => {
      if (e.message.includes('insertBefore') || e.message.includes('HierarchyRequestError') || e.message.includes('parameter 1 is not of type \'Node\'')) {
        e.preventDefault(); // prevents Next.js red screen
        console.warn('Silenced internal rrweb DOM error:', e.message);
      }
    };
    window.addEventListener('error', suppressRrwebErrors);

    let destroyed = false;

    // Pre-calculate idle gaps (periods of no mutations > 3000ms)
    const IDLE_THRESHOLD = 3000;
    const idleGaps: { start: number, end: number }[] = [];
    const startTime = events[0].timestamp;
    let lastTs = startTime;
    for (let i = 1; i < events.length; i++) {
      if (events[i].timestamp - lastTs > IDLE_THRESHOLD) {
        idleGaps.push({ start: (lastTs - startTime) + 500, end: (events[i].timestamp - startTime) - 500 });
      }
      lastTs = events[i].timestamp;
    }

    const initPlayer = async (width: number, height: number) => {
      if (destroyed || playerRef.current) return;
      const rrwebPlayer = (await import('rrweb-player')).default;
      if (destroyed || playerRef.current) return;

      playerRef.current = new rrwebPlayer({
        target: containerRef.current!,
        props: {
          events,
          width,
          height: height - 80,
          autoPlay: true,
          skipInactive: false, // We handle it manually now
          showWarning: false,
        },
      });

      // --- CRITICAL FIX FOR rrweb INTERNAL BUGS ---
      // Monkey-patch the iframe's DOM manipulation methods to silently ignore missing nodes.
      // rrweb completely DESTROYS and recreates the iframe during full snapshots, so we must
      // continuously check and re-apply the patch if the iframe is new.
      const patchInterval = setInterval(() => {
        try {
          const replayer = playerRef.current?.getReplayer();
          const iframeWindow = replayer?.iframe?.contentWindow;
          if (iframeWindow && iframeWindow.Node) {
            const NodeProto = iframeWindow.Node.prototype as any;
            
            // Only patch if we haven't patched this specific iframe instance yet
            if (!NodeProto.__rrweb_patched) {
              NodeProto.__rrweb_patched = true;
              
              const origInsertBefore = NodeProto.insertBefore;
              NodeProto.insertBefore = function(newNode: any, refNode: any) {
                if (!newNode) return newNode;
                try { return origInsertBefore.call(this, newNode, refNode); } catch (e) { return newNode; }
              };
              
              const origAppendChild = NodeProto.appendChild;
              NodeProto.appendChild = function(newNode: any) {
                if (!newNode) return newNode;
                try { return origAppendChild.call(this, newNode); } catch (e) { return newNode; }
              };
              
              const origRemoveChild = NodeProto.removeChild;
              NodeProto.removeChild = function(child: any) {
                if (!child) return child;
                try { return origRemoveChild.call(this, child); } catch (e) { return child; }
              };
              
              const origReplaceChild = NodeProto.replaceChild;
              NodeProto.replaceChild = function(newChild: any, oldChild: any) {
                if (!newChild || !oldChild) return oldChild;
                try { return origReplaceChild.call(this, newChild, oldChild); } catch (e) { return oldChild; }
              };

              // Prevent "e.setAttribute is not a function" when rrweb confuses a TextNode for an Element
              if (!NodeProto.setAttribute) {
                NodeProto.setAttribute = function() {};
              }
              if (!NodeProto.removeAttribute) {
                NodeProto.removeAttribute = function() {};
              }
            }

            // Forward keydown events from the iframe to the host window so Spacebar works when video is focused
            if (!(iframeWindow as any).__rrweb_keydown_patched) {
              (iframeWindow as any).__rrweb_keydown_patched = true;
              iframeWindow.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.code === 'Space' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePlay();
                }
              }, { capture: true });
            }
          }
        } catch (e) {
          // ignore cross-origin or init errors
        }
      }, 100);

      // Method 1: Use the Svelte component's `ui-update-current-time` event (most reliable)
      try {
        playerRef.current.$on('ui-update-current-time', (ev: CustomEvent) => {
          if (ev?.detail !== undefined) {
            setCurrentMs(ev.detail);
            if (onTimeUpdate) onTimeUpdate(ev.detail);
          }
        });
      } catch {
        // Svelte event not available — fall through to method 2
      }

      // Method 2: Fallback — poll getCurrentTime() every 250ms
      const poll = setInterval(() => {
        try {
          const t = playerRef.current?.getCurrentTime?.();
          if (typeof t === 'number' && t >= 0) {
            setCurrentMs(t);
            if (onTimeUpdate) onTimeUpdate(t);

            // CUSTOM SKIP IDLE LOGIC
            // Ensure we don't try to skip while dragging or immediately after a seek
            if (skipIdleRef.current && !isDraggingRef.current && Date.now() - lastSeekTime.current > 500) {
              const gap = idleGaps.find(g => t >= g.start && t < g.end);
              if (gap) {
                // Skip to the end of the gap safely
                lastSeekTime.current = Date.now();
                try {
                  playerRef.current.goto(Math.floor(gap.end), true);
                } catch (e) {
                  console.warn('rrweb skip idle goto error', e);
                }
              }
            }
          }
        } catch { /* ignore */ }
      }, 250);

      // Method 3: Also hook event-cast for sub-250ms precision when available
      try {
        const replayer = playerRef.current.getReplayer();
        replayer.on('event-cast', (ev: any) => {
          if (!ev?.timestamp) return;
          const offsetMs = ev.timestamp - startTime;
          if (offsetMs >= 0) {
            setCurrentMs(offsetMs);
            if (onTimeUpdate) onTimeUpdate(offsetMs);
          }
        });
      } catch {
        // Replayer not available in this version — no-op
      }

      // Add Drag-to-Seek functionality to the native progress bar
      setTimeout(() => {
        const progressEl = containerRef.current?.querySelector('.rr-progress') as HTMLElement | null;
        if (progressEl) {
          let wasPlaying = false;
          let targetTime = 0;
          const durationMs = events[events.length - 1].timestamp - startTime;

          const stepEl = progressEl.querySelector('.rr-progress__step') as HTMLElement | null;
          const handlerEl = progressEl.querySelector('.rr-progress__handler') as HTMLElement | null;

          const onMouseMove = (e: MouseEvent | PointerEvent) => {
            if (!isDraggingRef.current || !playerRef.current) return;
            e.preventDefault();
            const rect = progressEl.getBoundingClientRect();
            let pct = (e.clientX - rect.left) / rect.width;
            pct = Math.max(0, Math.min(1, pct));
            targetTime = pct * durationMs;
            
            // 1. Visually update the Svelte progress bar instantly
            if (stepEl) stepEl.style.width = `${pct * 100}%`;
            if (handlerEl) handlerEl.style.left = `${pct * 100}%`;
            
            // 2. Visually update our custom digital clock
            setCurrentMs(targetTime);
          };

          const onMouseUp = () => {
            if (!isDraggingRef.current) return;
            isDraggingRef.current = false;
            window.removeEventListener('mousemove', onMouseMove, { capture: true });
            window.removeEventListener('mouseup', onMouseUp, { capture: true });
            window.removeEventListener('pointermove', onMouseMove, { capture: true });
            window.removeEventListener('pointerup', onMouseUp, { capture: true });
            
            if (playerRef.current) {
              lastSeekTime.current = Date.now();
              try {
                playerRef.current.goto(Math.floor(targetTime));
              } catch (e) {
                console.warn('rrweb drag goto error', e);
              }
              if (wasPlaying) {
                // slight delay to let DOM settle before resuming play
                setTimeout(() => {
                  try {
                    playerRef.current?.play();
                  } catch (e) {}
                }, 50);
              }
            }
          };

          const onMouseDown = (e: MouseEvent | PointerEvent) => {
            if (e.button !== 0) return;
            // CRITICAL: Block Svelte from seeing this event and crashing rrweb with its own native seek
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            isDraggingRef.current = true;
            
            const state = playerRef.current?.getMetaData()?.state;
            wasPlaying = state === 'playing';
            if (wasPlaying) {
              playerRef.current.pause();
            }
            
            window.addEventListener('mousemove', onMouseMove, { capture: true });
            window.addEventListener('mouseup', onMouseUp, { capture: true });
            window.addEventListener('pointermove', onMouseMove, { capture: true });
            window.addEventListener('pointerup', onMouseUp, { capture: true });
            
            // Jump to click point immediately
            onMouseMove(e);
          };

          const onNativeClick = (e: Event) => {
            // Block native svelte click-to-seek
            e.stopPropagation();
            e.stopImmediatePropagation();
          };

          progressEl.addEventListener('mousedown', onMouseDown, { capture: true });
          progressEl.addEventListener('pointerdown', onMouseDown, { capture: true });
          progressEl.addEventListener('click', onNativeClick, { capture: true });
          
          playerCleanup = () => {
            progressEl.removeEventListener('mousedown', onMouseDown, { capture: true });
            progressEl.removeEventListener('pointerdown', onMouseDown, { capture: true });
            progressEl.removeEventListener('click', onNativeClick, { capture: true });
            window.removeEventListener('mousemove', onMouseMove, { capture: true });
            window.removeEventListener('mouseup', onMouseUp, { capture: true });
            window.removeEventListener('pointermove', onMouseMove, { capture: true });
            window.removeEventListener('pointerup', onMouseUp, { capture: true });
            clearInterval(poll);
            clearInterval(patchInterval);
          };
        }
      }, 100);

      // --- GLOBAL KEYBOARD & CLICK SHORTCUTS ---
      const onKeyDown = (e: KeyboardEvent) => {
        // Support both e.code and e.key for browser compatibility
        if (e.code === 'Space' || e.key === ' ') {
          // Only trigger spacebar if the user isn't typing in an input
          if (e.target instanceof HTMLElement) {
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
              return;
            }
          }
          e.preventDefault();
          e.stopPropagation();
          togglePlay();
        }
      };
      
      const onVideoClick = (e: MouseEvent) => {
        // Only toggle if the click was directly on the video area, not the controller or header
        const target = e.target as HTMLElement;
        if (!target.closest('.rr-controller') && !target.closest('.browser-chrome')) {
          togglePlay();
        }
      };

      // Use capture: true so we intercept the spacebar before anything else (like Svelte or the browser) swallows it
      window.addEventListener('keydown', onKeyDown, { capture: true });
      containerRef.current?.addEventListener('click', onVideoClick);

      return () => {
        window.removeEventListener('keydown', onKeyDown, { capture: true });
        containerRef.current?.removeEventListener('click', onVideoClick);
        window.removeEventListener('error', suppressRrwebErrors);
        clearInterval(patchInterval);
        if (!playerCleanup) clearInterval(poll);
      };
    };

    let playerCleanup: (() => void) | undefined;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (!playerRef.current && width > 0 && height > 0) {
        initPlayer(Math.floor(width), Math.floor(height)).then(fn => {
          playerCleanup = fn;
        });
      }
    });
    ro.observe(wrapperRef.current);

    return () => {
      destroyed = true;
      ro.disconnect();
      playerCleanup?.();
      if (playerRef.current) {
        try { playerRef.current.pause(); } catch (e) {}
        try { playerRef.current.$destroy(); } catch (e) {}
      }
      if (containerRef.current) containerRef.current.innerHTML = '';
      playerRef.current = null;
    };
  }, [events, onTimeUpdate]); // intentionally omit skipInactive from deps so it doesn't re-init player

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  const handleDotClick = useCallback((offsetMs: number) => {
    if (!playerRef.current) return;
    playerRef.current.goto(offsetMs, true);
  }, []);

  const recordedUrl = events[0]?.data?.href ?? 'https://your-app.com';

  if (!events || events.length < 2) {
    return (
      <div className="flex h-full w-full items-center justify-center flex-col gap-4">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(163,230,53,0.06)', border: '1px solid rgba(163,230,53,0.12)' }}>
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

  const formatTime = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden rounded-2xl" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Browser Chrome */}
      <div className="flex items-center gap-3 px-5 py-3.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ background: '#FF5F56', boxShadow: '0 0 6px rgba(255,95,86,0.5)' }} />
          <div className="h-3 w-3 rounded-full" style={{ background: '#FFBD2E', boxShadow: '0 0 6px rgba(255,189,46,0.4)' }} />
          <div className="h-3 w-3 rounded-full" style={{ background: '#27C93F', boxShadow: '0 0 6px rgba(39,201,63,0.4)' }} />
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg max-w-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <svg className="h-3 w-3 shrink-0" style={{ color: '#a3e635', opacity: 0.6 }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="truncate text-xs text-neutral-500 font-mono">{recordedUrl}</span>
        </div>
        
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <div className="mr-4 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-[10px] text-neutral-300 tracking-wider flex items-center gap-1.5">
            <span className="text-white font-bold">{formatTime(currentMs)}</span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-500">{formatTime(totalMs)}</span>
          </div>

          <button
            onClick={() => setSkipIdle(!skipIdle)}
            title="Automatically skip periods of inactivity"
            className={`mr-3 flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono tracking-widest uppercase transition-colors ${skipIdle ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] border border-[var(--color-accent-green)]/30' : 'bg-white/5 text-neutral-500 hover:text-white border border-white/10'}`}
          >
            {skipIdle ? 'SKIP IDLE: ON' : 'SKIP IDLE: OFF'}
          </button>

          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }}>Space</kbd>
          <span className="text-[10px] text-neutral-700">to play/pause</span>
        </div>
      </div>

      {/* Replay area */}
      <div ref={wrapperRef} className="flex-1 min-h-0 relative overflow-hidden" style={{ background: '#080808' }}>
        <div ref={containerRef} className="rrweb-player-container w-full h-full" />

        {/* Click-to-pause transparent overlay — covers only the video, not the control bar */}
        <div
          className="absolute inset-x-0 top-0 cursor-pointer"
          style={{ bottom: '80px', zIndex: 10 }}
          onClick={togglePlay}
        />

        {/* Frustration markers — overlaid ON the rrweb scrubber track */}
        {frustrationDots.length > 0 && totalMs > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: `${SCRUBBER_BOTTOM_PX}px`,
              height: 0,
              left: '10%',
              right: '10%',
            }}
          >
            {frustrationDots.map((dot, i) => {
              const cfg = DOT_CFG[dot.type];
              const pct = Math.min((dot.offsetMs / totalMs) * 100, 100);
              const isHovered = hoveredIdx === i;
              const s = Math.floor(dot.offsetMs / 1000);
              const timeStr = s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

              return (
                <div
                  key={i}
                  style={{ position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'auto', zIndex: 50 }}
                >
                  {isHovered && (
                    <div style={{
                      position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)',
                      background: '#1a1a1a', border: `1px solid ${cfg.color}50`, borderRadius: '8px',
                      padding: '5px 10px', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 100,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: cfg.color }}>{dot.label}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4b5563' }}>· {timeStr}</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleDotClick(dot.offsetMs)}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{
                      width: isHovered ? '14px' : '10px', height: isHovered ? '14px' : '10px',
                      borderRadius: '50%', background: cfg.color,
                      boxShadow: isHovered ? `0 0 0 3px ${cfg.glow}, 0 0 16px ${cfg.glow}` : `0 0 8px ${cfg.glow}`,
                      border: `2px solid ${isHovered ? '#fff' : cfg.color}`,
                      cursor: 'pointer', padding: 0, transition: 'all 0.15s ease', display: 'block',
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}