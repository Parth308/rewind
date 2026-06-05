import { getSystemMetrics } from '@/lib/system';
import { FadeUp } from '@/components/ui/fade-up';
import { Activity, Database, Cpu, Server, Zap, ArrowRight, Layers } from 'lucide-react';

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
    <div className="flex flex-col gap-10 pb-10">
      <FadeUp>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">System topology.</h1>
            <p className="text-lg text-white/[0.618] max-w-2xl">Real-time resource allocation and queue processing metrics.</p>
          </div>
        </div>
      </FadeUp>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Core Infrastructure */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          <FadeUp delay={0.1}>
            <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] opacity-30" />
              <div className="absolute top-0 right-0 -mt-32 -mr-32 w-64 h-64 bg-[var(--color-accent-green)] opacity-[0.03] blur-[80px] rounded-full transition-opacity duration-1000 group-hover:opacity-10" />

              <h3 className="font-serif text-2xl font-bold text-white mb-10 relative z-10 flex items-center gap-3">
                Infrastructure Allocation
              </h3>

              <div className="space-y-10 relative z-10">
                {/* Node Server RAM */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-[var(--color-accent-green)]" />
                      <span className="text-sm font-mono text-neutral-400">Node Cluster RAM</span>
                    </div>
                    <div className="font-mono text-xl text-white">
                      {formatBytes(os.usedMem)} <span className="text-sm text-neutral-600">/ {formatBytes(os.totalMem)}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
                    <div 
                      className="h-full bg-[var(--color-accent-green)] shadow-[0_0_10px_var(--color-accent-green)]" 
                      style={{ width: `${os.memUsagePercent}%`, opacity: 0.8 }} 
                    />
                  </div>
                </div>

                {/* PostgreSQL Size */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-mono text-neutral-400">PostgreSQL Volume</span>
                    </div>
                    <div className="font-mono text-xl text-white">{dbSize}</div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
                    <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] w-[15%]" />
                  </div>
                </div>

                {/* Redis Cache */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-mono text-neutral-400">Redis Memory Store</span>
                    </div>
                    <div className="font-mono text-xl text-white">{redis.memory}</div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
                    <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] w-[8%]" />
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Bottom Row: BullMQ Queue */}
          <FadeUp delay={0.2}>
            <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-8 relative overflow-hidden group">
              <h3 className="font-serif text-2xl font-bold text-white mb-8 relative z-10 flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-400" /> BullMQ Ingestion Queue
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                {[
                  { label: "WAITING", value: redis.queueCounts.waiting || 0, color: "text-neutral-300", border: "border-neutral-700" },
                  { label: "ACTIVE", value: redis.queueCounts.active || 0, color: "text-blue-400", border: "border-blue-500/30", glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]" },
                  { label: "COMPLETED", value: redis.queueCounts.completed || 0, color: "text-[var(--color-accent-green)]", border: "border-[var(--color-accent-green)]/30", glow: "shadow-[0_0_15px_rgba(163,230,53,0.15)]" },
                  { label: "FAILED", value: redis.queueCounts.failed || 0, color: "text-red-400", border: "border-red-500/30", glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]" }
                ].map((stat, i) => (
                  <div key={i} className={`bg-[#111] rounded-xl p-5 border ${stat.border} ${stat.glow || ''} relative overflow-hidden`}>
                    <div className={`text-[10px] font-mono tracking-[0.2em] mb-3 ${stat.color} opacity-70`}>{stat.label}</div>
                    <div className={`text-3xl font-mono font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>

        {/* Right Column: Host Info */}
        <FadeUp delay={0.3} className="h-full">
          <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-8 h-full relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />
            
            <h3 className="font-serif text-2xl font-bold text-white mb-8 relative z-10 flex items-center gap-3">
              <Cpu className="w-5 h-5 text-indigo-400" /> Host Machine
            </h3>

            {/* Dynamic Compute Rack Graphic */}
            <div className="w-full bg-[#111] border border-white/5 rounded-lg p-4 space-y-3 mb-10 shadow-inner max-h-[180px] overflow-y-auto">
              {Array.from({ length: os.cpus }).map((_, i) => {
                // Pseudo-random load per core based on system loadavg and uptime
                const baseLoad = (os.loadavg[0] / Math.max(1, os.cpus)) * 100;
                const load = Math.max(5, Math.min(95, baseLoad + (Math.sin(os.uptime + i * 45) * 20)));
                const isActive = load > 50;
                
                return (
                  <div key={i} className="flex gap-3 items-center">
                    <span className="text-[9px] font-mono text-neutral-600 w-4 text-right">0{i}</span>
                    <div className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-1000 ${isActive ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-indigo-400/20'}`} />
                    <div className="flex-1 h-3 bg-white/5 rounded overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500/50 transition-all duration-1000 ease-out" 
                        style={{ width: `${load}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="space-y-6 relative z-10 flex-1">
              <div className="flex flex-col gap-1 border-b border-[var(--color-border-dark)] pb-4">
                <span className="text-[10px] font-mono text-neutral-500 tracking-[0.2em]">UPTIME</span>
                <span className="text-xl font-mono text-white">{formatUptime(os.uptime)}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-[var(--color-border-dark)] pb-4">
                <span className="text-[10px] font-mono text-neutral-500 tracking-[0.2em]">ARCHITECTURE</span>
                <span className="text-xl font-mono text-white">{os.arch}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-[var(--color-border-dark)] pb-4">
                <span className="text-[10px] font-mono text-neutral-500 tracking-[0.2em]">PLATFORM</span>
                <span className="text-xl font-mono text-white">{os.platform} {os.release}</span>
              </div>
              <div className="flex flex-col gap-1 pb-4">
                <span className="text-[10px] font-mono text-neutral-500 tracking-[0.2em]">COMPUTE</span>
                <span className="text-xl font-mono text-white">{os.cpus} vCores</span>
              </div>
            </div>
          </div>
        </FadeUp>

      </div>
    </div>
  );
}
