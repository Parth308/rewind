// components/ui/player.tsx
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

type FrustrationDot = {
  offsetMs: number;
  type: 'rage' | 'dead' | 'uturn' | 'scroll';
  label: string;
};

// Color, glow, label per frustration type
const DOT_CFG: Record<FrustrationDot['type'], { color: string; glow: string; emoji: string; desc: string }> = {
  rage: { color: '#fb923c', glow: 'rgba(251,146,60,0.5)', emoji: '🔥', desc: 'Rage Click — rapid repeated clicks in same area' },
  dead: { color: '#facc15', glow: 'rgba(250,204,21,0.5)', emoji: '💀', desc: 'Dead Click — click with no DOM response' },
  uturn: { color: '#60a5fa', glow: 'rgba(96,165,250,0.5)', emoji: '↩️', desc: 'U-Turn — immediate page navigation reversal' },
  scroll: { color: '#c084fc', glow: 'rgba(192,132,252,0.5)', emoji: '↕️', desc: 'Wild Scrolling — excessive erratic scrolling' },
};

// The rrweb control bar is 80px (flex-col, justify-content: space-around, 2 rows).
// Timeline row is ~20px tall, buttons row ~32px tall, leaving 28px of spacing.
// space-around: ~7px top margin + 10px to center of timeline row = 17px from controller top
// → scrubber center is at 80 - 17 = 63px from wrapper bottom.
const SCRUBBER_BOTTOM_PX = 65;

export default function Player({
  events,
  frustrationDots = [],
  totalMs = 0,
}: {
  events: any[];
  frustrationDots?: FrustrationDot[];
  totalMs?: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    const p = playerRef.current;
    if (typeof p.toggle === 'function') p.toggle();
    else if (typeof p.play === 'function') p.play();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || !wrapperRef.current || events.length < 2) return;
    let destroyed = false;

    const initPlayer = async (width: number, height: number) => {
      if (destroyed || playerRef.current) return;
      const rrwebPlayer = (await import('rrweb-player')).default;
      if (destroyed || playerRef.current) return;
      playerRef.current = new rrwebPlayer({
        target: containerRef.current!,
        props: {
          events,
          width,
          height: height - 80, // leave room for control bar
          autoPlay: true,
          skipInactive: true,
          showWarning: false,
        },
      });
    };

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (!playerRef.current && width > 0 && height > 0) {
        initPlayer(Math.floor(width), Math.floor(height));
      }
    });
    ro.observe(wrapperRef.current);

    return () => {
      destroyed = true;
      ro.disconnect();
      if (containerRef.current) containerRef.current.innerHTML = '';
      playerRef.current = null;
    };
  }, [events]);

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
    const p = playerRef.current;
    // rrweb-player exposes goto(timeMs, play?)
    if (typeof p.goto === 'function') {
      p.goto(offsetMs, true);
    } else if (p.$set) {
      // Svelte component fallback: set currentTime
      p.$set({ currentTime: offsetMs });
    }
  }, []);

  const recordedUrl =
    events.length > 0 && events[0]?.data?.href
      ? events[0].data.href
      : 'https://your-app.com';

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

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden rounded-2xl"
      style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Browser Chrome */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ background: '#FF5F56', boxShadow: '0 0 6px rgba(255,95,86,0.5)' }} />
          <div className="h-3 w-3 rounded-full" style={{ background: '#FFBD2E', boxShadow: '0 0 6px rgba(255,189,46,0.4)' }} />
          <div className="h-3 w-3 rounded-full" style={{ background: '#27C93F', boxShadow: '0 0 6px rgba(39,201,63,0.4)' }} />
        </div>
        <div
          className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg max-w-md overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <svg className="h-3 w-3 shrink-0" style={{ color: '#a3e635', opacity: 0.6 }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="truncate text-xs text-neutral-500 font-mono">{recordedUrl}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }}>Space</kbd>
          <span className="text-[10px] text-neutral-700">to play/pause</span>
        </div>
      </div>

      {/* Replay area */}
      <div ref={wrapperRef} className="flex-1 min-h-0 relative overflow-hidden" style={{ background: '#080808' }}>
        <div ref={containerRef} className="rrweb-player-container w-full h-full" />

        {/* Frustration markers — overlaid ON the rrweb progress track */}
        {frustrationDots.length > 0 && totalMs > 0 && (
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              // The .rr-progress track center sits inside the 80px control bar.
              // .rr-controller is flex-col justify-space-around → timeline is in upper section ≈ 26px from bottom of bar.
              bottom: `${SCRUBBER_BOTTOM_PX}px`,
              height: 0,
              // Horizontal padding mirrors rrweb's 80% width + centering:
              // rrweb: .rr-timeline width:80%, centered → 10% margin each side of .rr-controller width.
              // But .rr-controller is 100% of wrapper width, so left/right 10% of wrapper.
              left: '10%',
              right: '10%',
            }}
          >
            {frustrationDots.map((dot, i) => {
              const cfg = DOT_CFG[dot.type];
              const pct = Math.min((dot.offsetMs / totalMs) * 100, 100);
              const isHovered = hoveredIdx === i;
              const offsetSec = Math.floor(dot.offsetMs / 1000);
              const mm = Math.floor(offsetSec / 60);
              const ss = offsetSec % 60;
              const timeStr = mm > 0 ? `${mm}m ${ss}s` : `${ss}s`;

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'auto',
                    zIndex: 50,
                  }}
                >
                  {/* Tooltip — compact: just name + time */}
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '18px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1a1a1a',
                        border: `1px solid ${cfg.color}50`,
                        borderRadius: '8px',
                        padding: '5px 10px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 100,
                        boxShadow: `0 4px 20px rgba(0,0,0,0.7)`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>{cfg.emoji}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: cfg.color }}>{dot.label}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4b5563' }}>· {timeStr}</span>
                    </div>
                  )}

                  {/* The dot itself */}
                  <button
                    onClick={() => handleDotClick(dot.offsetMs)}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    title={`${dot.label} at ${timeStr}`}
                    style={{
                      width: isHovered ? '14px' : '10px',
                      height: isHovered ? '14px' : '10px',
                      borderRadius: '50%',
                      background: cfg.color,
                      boxShadow: isHovered
                        ? `0 0 0 3px ${cfg.glow}, 0 0 16px ${cfg.glow}`
                        : `0 0 8px ${cfg.glow}`,
                      border: `2px solid ${isHovered ? '#fff' : cfg.color}`,
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s ease',
                      display: 'block',
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