import Link from 'next/link';
import { db } from '@/lib/db';
import { events, sessions, consoleLogs, networkRequests } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { formatDistanceToNow } from 'date-fns';
import { FadeUp } from '@/components/ui/fade-up';
import { SessionContent } from '@/components/ui/session-content';
import { ArrowLeft, Flame, MousePointerClick, CornerUpLeft, ChevronsUpDown } from 'lucide-react';

type FrustrationDot = {
  offsetMs: number;
  label: string;
  type: 'rage' | 'dead' | 'uturn' | 'scroll' | 'custom';
};

export const dynamic = 'force-dynamic';

export default async function SessionReplay(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const sessionList = await db.select().from(sessions).where(eq(sessions.id, params.id));
  const session = sessionList[0] || null;

  const dbEvents = await db.select().from(events).where(eq(events.sessionId, params.id)).orderBy(events.timestamp);
  const rrwebEvents = dbEvents.map(e => e.data as any);

  const logs    = await db.select().from(consoleLogs).where(eq(consoleLogs.sessionId, params.id)).orderBy(consoleLogs.timestamp);
  const network = await db.select().from(networkRequests).where(eq(networkRequests.sessionId, params.id)).orderBy(networkRequests.timestamp);

  // Compute frustration dot positions and custom events from rrweb events
  const frustrationDots: FrustrationDot[] = [];
  const customEvents: any[] = [];

  if (rrwebEvents.length > 0) {
    const startTime = rrwebEvents[0].timestamp;
    const clicks: any[] = [];
    let scrollCount = 0;

    for (let i = 0; i < rrwebEvents.length; i++) {
      const ev = rrwebEvents[i];
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
              frustrationDots.push({ offsetMs: ev.timestamp - startTime, label: 'Rage Click', type: 'rage' });
              clicks.length = 0;
              isRage = true;
            }
          }
          if (!isRage) {
            let hasMutation = false;
            for (let j = i + 1; j < rrwebEvents.length; j++) {
              const nextEv = rrwebEvents[j];
              if (nextEv.timestamp - ev.timestamp > 2000) break;
              if (nextEv.type === 3 && nextEv.data.source === 0) { hasMutation = true; break; }
            }
            if (!hasMutation) {
              frustrationDots.push({ offsetMs: ev.timestamp - startTime, label: 'Dead Click', type: 'dead' });
            }
          }
        }
        if (ev.data.source === 3) {
          scrollCount++;
          if (scrollCount === 21) {
            frustrationDots.push({ offsetMs: ev.timestamp - startTime, label: 'Wild Scrolling', type: 'scroll' });
            scrollCount = 0;
          }
        }
      }
      if ((ev.type === 5 && ev.data?.tag === 'navigation') || ev.type === 4) {
        for (let j = i + 1; j < rrwebEvents.length; j++) {
          const nextEv = rrwebEvents[j];
          if (nextEv.timestamp - ev.timestamp > 5000) break;
          if ((nextEv.type === 5 && nextEv.data?.tag === 'navigation') || nextEv.type === 4) {
            frustrationDots.push({ offsetMs: nextEv.timestamp - startTime, label: 'U-Turn', type: 'uturn' });
            break;
          }
        }
      }
      
      // Parse Custom Events (type: 5)
      if (ev.type === 5 && ev.data && ev.data.tag) {
        // Skip 'navigation' custom events as they are internal metrics for U-Turns
        if (ev.data.tag !== 'navigation') {
          customEvents.push({
            id: `custom-${ev.timestamp}-${i}`,
            timestamp: ev.timestamp,
            name: ev.data.tag,
            payload: ev.data.payload || {}
          });
          frustrationDots.push({
            offsetMs: ev.timestamp - startTime,
            label: ev.data.tag,
            type: 'custom'
          });
        }
      }
    }
  }

  if (!session) return (
    <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
      <div className="font-mono text-neutral-600 text-sm border border-neutral-800 bg-[#111] p-6 rounded-xl">Session Reference Not Found</div>
      <Link href="/dashboard" className="text-xs font-mono text-neutral-500 hover:text-white transition-colors flex items-center gap-2">
        <ArrowLeft className="w-3 h-3" /> Return to Sessions
      </Link>
    </div>
  );

  const totalMs = session.durationMs ?? 0;
  const sessionStartTime = rrwebEvents[0]?.timestamp ?? 0;

  const durStr = totalMs
    ? totalMs >= 60000
      ? `${Math.floor(totalMs / 60000)}m ${Math.round((totalMs % 60000) / 1000)}s`
      : `${Math.round(totalMs / 1000)}s`
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
              <div className="font-mono text-lg text-white font-bold tracking-wider">{params.id}</div>
              <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 mt-1 uppercase tracking-widest">
                {session.os     && <span className="text-[var(--color-accent-green)]">{session.os}</span>}
                {session.browser && <span>{session.browser}</span>}
                {durStr          && <span className="text-indigo-400">{durStr} DURATION</span>}
                {session.startedAt && (
                  <span>{formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}</span>
                )}
              </div>
              {(session.hasRageClicks || session.hasDeadClicks || session.hasUTurns || session.hasWildScrolling) && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {session.hasRageClicks   && <div className="flex items-center gap-1.5 text-xs text-orange-400 font-mono bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/20"><Flame className="w-3.5 h-3.5" /> RAGE CLICKS</div>}
                  {session.hasDeadClicks   && <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-mono bg-yellow-500/10 px-2.5 py-1 rounded border border-yellow-500/20"><MousePointerClick className="w-3.5 h-3.5" /> DEAD CLICKS</div>}
                  {session.hasUTurns       && <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20"><CornerUpLeft className="w-3.5 h-3.5" /> U-TURNS</div>}
                  {session.hasWildScrolling && <div className="flex items-center gap-1.5 text-xs text-purple-400 font-mono bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20"><ChevronsUpDown className="w-3.5 h-3.5" /> WILD SCROLLING</div>}
                </div>
              )}
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

      {/* Main Content — client component handles player + time-synced sidebar */}
      <FadeUp delay={0.1} className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <SessionContent
          sessionId={session.id}
          initialTags={(session.tags as string[]) || []}
          initialNotes={session.notes || ''}
          rrwebEvents={rrwebEvents}
          frustrationDots={frustrationDots}
          totalMs={totalMs}
          sessionStartTime={sessionStartTime}
          logs={logs}
          network={network}
          customEvents={customEvents}
        />
      </FadeUp>
    </div>
  );
}
