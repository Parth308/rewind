import { ArrowLeft } from 'lucide-react';

export default function SessionReplayLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse" style={{ height: 'calc(100vh - 7rem)' }}>
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between p-6 bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl relative overflow-hidden shadow-xl shrink-0">
        <div className="flex items-center gap-6 relative z-10">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 shrink-0">
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </div>
          <div className="h-8 w-px bg-[var(--color-border-dark)]" />
          <div>
            <div className="h-6 w-64 bg-white/5 rounded mb-2" />
            <div className="flex items-center gap-4">
              <div className="h-4 w-20 bg-white/5 rounded" />
              <div className="h-4 w-24 bg-white/5 rounded" />
              <div className="h-4 w-32 bg-white/5 rounded" />
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="h-10 w-24 bg-white/5 rounded-lg border border-white/10" />
          <div className="h-10 w-32 bg-[#111] border border-[var(--color-border-dark)] rounded-lg" />
        </div>
      </div>

      {/* Main Content (Player & Sidebar) Skeleton */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row gap-6">
        {/* Player Skeleton */}
        <div className="flex-1 bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl flex items-center justify-center">
           <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-white/5" />
           </div>
        </div>
        
        {/* Sidebar Skeleton */}
        <div className="w-full lg:w-96 bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl flex flex-col p-6 gap-6">
          <div className="h-10 w-full bg-white/5 rounded-lg" />
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-16 w-full bg-white/5 rounded-lg" />
            <div className="h-16 w-full bg-white/5 rounded-lg" />
            <div className="h-16 w-full bg-white/5 rounded-lg" />
            <div className="h-16 w-full bg-white/5 rounded-lg" />
            <div className="h-16 w-full bg-white/5 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
