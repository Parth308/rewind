'use client';

import { useEffect } from 'react';
import { Database, RefreshCw, ServerOff } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard rendering error captured:', error);
  }, [error]);

  const errorMessage = error?.message || '';
  const errorDigest = error?.digest || '';

  // Classify if this is a database or network connection failure
  const isDatabaseError =
    errorMessage.toLowerCase().includes('database') ||
    errorMessage.toLowerCase().includes('connection') ||
    errorMessage.toLowerCase().includes('pool') ||
    errorMessage.toLowerCase().includes('control plane') ||
    errorMessage.toLowerCase().includes('relation') ||
    errorMessage.toLowerCase().includes('select') ||
    errorMessage.toLowerCase().includes('postgres') ||
    errorDigest.includes('2500696954') || // Matches the Neon control plane error digest
    errorMessage.includes('XX000');

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-8 text-center relative overflow-hidden bg-[#050505] rounded-3xl border border-[var(--color-border-dark)] shadow-2xl">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/5 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-md flex flex-col items-center">
        {/* Animated Error Icon container */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)] mb-6 text-red-400">
          {isDatabaseError ? (
            <Database className="w-8 h-8 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
          ) : (
            <ServerOff className="w-8 h-8" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-sans font-bold tracking-tight text-white mb-3">
          {isDatabaseError ? 'Database Link Offline' : 'Dashboard Render Interrupted'}
        </h2>

        {/* Explanation */}
        <p className="text-sm font-sans text-neutral-400 mb-6 leading-relaxed">
          {isDatabaseError
            ? "The serverless database is currently suspended or taking too long to spin up (cold start). This is common for free-tier Neon instances that have been idle."
            : "An unexpected error occurred while loading this page. This could be due to a temporary server issue."}
        </p>

        {/* Detailed technical trace/info in collapsible console look */}
        <div className="w-full text-left bg-black/40 border border-white/5 rounded-xl p-4 mb-8 font-mono text-[11px] text-red-400/80 max-h-36 overflow-y-auto select-all leading-normal">
          <div className="text-neutral-500 uppercase tracking-widest text-[9px] mb-2 font-bold select-none border-b border-white/5 pb-1 flex justify-between">
            <span>Diagnostics Console</span>
            <span className="text-red-500/50">CODE: {isDatabaseError ? 'DB_TIMEOUT_XX000' : 'RENDER_ERR'}</span>
          </div>
          <span className="text-neutral-600 select-none">$</span> ERROR: {errorMessage || 'Unknown rendering interruption'}
          {errorDigest && (
            <div className="mt-1">
              <span className="text-neutral-600 select-none">$</span> DIGEST: {errorDigest}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => reset()}
          className="group relative flex items-center justify-center gap-2 bg-[var(--color-accent-green)] text-black font-semibold py-3.5 px-7 rounded-xl hover:bg-[#a6fc4c] transition-colors shadow-[0_0_20px_rgba(163,230,53,0.2)] hover:shadow-[0_0_30px_rgba(163,230,53,0.4)]"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Reconnect Database
        </button>
      </div>
    </div>
  );
}
