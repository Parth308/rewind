'use client';

export function StatCard({ label, value, color, glowClass, colorHex }: {
  label: string; value: string | number; color?: string; glowClass?: string; colorHex?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-dark)] bg-[#0A0A0A] p-3 sm:p-5 group transition-all duration-500 hover:border-white/20 h-full">
      <div className={`absolute top-0 right-0 -mt-12 -mr-12 w-40 h-40 opacity-10 blur-[50px] transition-opacity duration-500 group-hover:opacity-20 rounded-full ${glowClass || ''}`} style={colorHex ? { backgroundColor: colorHex } : {}} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:12px_12px] opacity-20" />
      <div className="relative z-10 flex flex-col h-full justify-center gap-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">{label}</div>
        <div className={`font-mono text-2xl sm:text-4xl font-bold tabular-nums tracking-tight ${color || ''}`} style={colorHex ? { color: colorHex } : {}}>{value}</div>
      </div>
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out" />
    </div>
  );
}
