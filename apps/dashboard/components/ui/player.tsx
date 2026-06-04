'use client';

import { useEffect, useRef } from 'react';
import 'rrweb-player/dist/style.css';

export default function Player({ events }: { events: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || events.length < 2) return;

    const initPlayer = async () => {
      // Dynamically import to avoid SSR issues
      const rrwebPlayer = (await import('rrweb-player')).default;
      
      if (playerRef.current) return;

      playerRef.current = new rrwebPlayer({
        target: containerRef.current!,
        props: {
          events,
          width: containerRef.current!.clientWidth,
          height: 600,
          autoPlay: true,
        },
      });
    };

    initPlayer();

    return () => {
      // Cleanup if necessary (rrweb-player doesn't have a straightforward destroy method, but we can clear innerHTML)
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      playerRef.current = null;
    };
  }, [events]);

  if (!events || events.length < 2) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center border border-white/10 bg-[#131313]">
        <p className="font-mono text-sm text-[#e5e2e1]/50">Not enough events to replay</p>
      </div>
    );
  }

  return (
    <div className="w-full border border-white/10 bg-[#131313] p-1">
      <div ref={containerRef} className="h-[600px] w-full overflow-hidden" />
    </div>
  );
}
