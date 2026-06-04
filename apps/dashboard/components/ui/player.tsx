// components/ui/player.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';

export default function Player({ events }: { events: any[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

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

      // Reserve space for rrweb's own control bar (~80px)
      const playerHeight = height - 80;

      playerRef.current = new rrwebPlayer({
        target: containerRef.current!,
        props: {
          events,
          width,
          height: playerHeight,
          autoPlay: true,
          skipInactive: true,
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

      {/* Replay area — flex-1, measured by ResizeObserver */}
      <div ref={wrapperRef} className="flex-1 min-h-0 relative overflow-hidden" style={{ background: '#080808' }}>
        <div ref={containerRef} className="rrweb-player-container w-full h-full" />
      </div>
    </div>
  );
}