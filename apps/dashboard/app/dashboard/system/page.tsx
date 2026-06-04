import { Server, Database, Cpu, Activity, Zap, Info } from 'lucide-react';
import { getSystemMetrics } from '@/lib/system';

export const dynamic = 'force-dynamic';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / (3600*24));
  const h = Math.floor(seconds % (3600*24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  return `${d}d ${h}h ${m}m`;
};

export default async function SystemPage() {
  const metrics = await getSystemMetrics();
  const { dbSize, os, redis } = metrics;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-1">System Overview</h1>
          <p className="text-sm text-neutral-400">Real-time metrics for database, queue, and server resources.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* PostgreSQL Card */}
        <div className="glass relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 border border-[var(--color-border-dark)]">
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-[inset_0_1px_0_rgba(59,130,246,0.2)]">
              <Database className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">PostgreSQL</span>
          </div>
          <div>
            <h3 className="text-sm text-neutral-400 mb-1">Database Size</h3>
            <p className="text-2xl font-serif font-bold text-white">{dbSize}</p>
          </div>
        </div>

        {/* Redis Card */}
        <div className="glass relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 border border-[var(--color-border-dark)]">
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 shadow-[inset_0_1px_0_rgba(239,68,68,0.2)]">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Redis Cache</span>
          </div>
          <div>
            <h3 className="text-sm text-neutral-400 mb-1">Memory Used</h3>
            <p className="text-2xl font-serif font-bold text-white">{redis.memory}</p>
          </div>
        </div>

        {/* Server RAM */}
        <div className="glass relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 border border-[var(--color-border-dark)]">
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)] flex items-center justify-center border border-[var(--color-accent-green)]/20 shadow-[inset_0_1px_0_rgba(163,230,53,0.2)]">
              <Server className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Node Server</span>
          </div>
          <div>
            <h3 className="text-sm text-neutral-400 mb-1">RAM Usage</h3>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-serif font-bold text-white">{formatBytes(os.usedMem)}</p>
              <p className="text-sm text-neutral-500 mb-1">/ {formatBytes(os.totalMem)} ({os.memUsagePercent}%)</p>
            </div>
          </div>
        </div>

        {/* Server Uptime */}
        <div className="glass relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 border border-[var(--color-border-dark)]">
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-[inset_0_1px_0_rgba(168,85,247,0.2)]">
              <Cpu className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Host OS</span>
          </div>
          <div>
            <h3 className="text-sm text-neutral-400 mb-1">Uptime</h3>
            <p className="text-2xl font-serif font-bold text-white">{formatUptime(os.uptime)}</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Queue Metrics */}
        <div className="glass rounded-2xl p-6 border border-[var(--color-border-dark)]">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="h-5 w-5 text-yellow-400" />
            <h3 className="font-serif text-xl font-bold text-white">BullMQ Job Queue</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#050505] rounded-xl p-4 border border-white/5 shadow-inner">
              <p className="text-xs text-neutral-500 mb-1 font-medium">Waiting</p>
              <p className="text-xl font-serif font-bold text-white">{redis.queueCounts.waiting || 0}</p>
            </div>
            <div className="bg-[#050505] rounded-xl p-4 border border-white/5 shadow-inner">
              <p className="text-xs text-blue-400/70 mb-1 font-medium">Active</p>
              <p className="text-xl font-serif font-bold text-blue-400">{redis.queueCounts.active || 0}</p>
            </div>
            <div className="bg-[#050505] rounded-xl p-4 border border-white/5 shadow-inner">
              <p className="text-xs text-[var(--color-accent-green)]/70 mb-1 font-medium">Completed</p>
              <p className="text-xl font-serif font-bold text-[var(--color-accent-green)]">{redis.queueCounts.completed || 0}</p>
            </div>
            <div className="bg-[#050505] rounded-xl p-4 border border-white/5 shadow-inner">
              <p className="text-xs text-red-400/70 mb-1 font-medium">Failed</p>
              <p className="text-xl font-serif font-bold text-red-400">{redis.queueCounts.failed || 0}</p>
            </div>
          </div>
        </div>

        {/* Server Info */}
        <div className="glass rounded-2xl p-6 border border-[var(--color-border-dark)]">
          <div className="flex items-center gap-3 mb-6">
            <Info className="h-5 w-5 text-indigo-400" />
            <h3 className="font-serif text-xl font-bold text-white">Host Information</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-sm text-neutral-400">Architecture</span>
              <span className="text-sm font-mono text-neutral-200">{os.arch}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-sm text-neutral-400">Platform</span>
              <span className="text-sm font-mono text-neutral-200">{os.platform} {os.release}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">CPU Cores</span>
              <span className="text-sm font-mono text-neutral-200">{os.cpus} vCores</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
