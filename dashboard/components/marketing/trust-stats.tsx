export const TrustStats = () => {
  return (
    <section className="border-y border-[var(--color-border-dark)] bg-black/40 backdrop-blur-sm py-8 relative z-10">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border-dark)] text-center">
        <div className="flex-1 w-full pt-4 md:pt-0">
          <div className="font-serif text-3xl text-white mb-1">100%</div>
          <div className="text-xs uppercase tracking-widest text-neutral-500">Data Ownership</div>
        </div>
        <div className="flex-1 w-full pt-4 md:pt-0">
          <div className="font-serif text-3xl text-white mb-1">&lt; 50MB</div>
          <div className="text-xs uppercase tracking-widest text-neutral-500">RAM Footprint</div>
        </div>
        <div className="flex-1 w-full pt-4 md:pt-0">
          <div className="font-serif text-3xl text-white mb-1">$6/mo</div>
          <div className="text-xs uppercase tracking-widest text-neutral-500">Base Infra Cost</div>
        </div>
        <div className="flex-1 w-full pt-4 md:pt-0">
          <div className="font-serif text-3xl text-white mb-1">Zero</div>
          <div className="text-xs uppercase tracking-widest text-neutral-500">Network Latency</div>
        </div>
      </div>
    </section>
  );
};
