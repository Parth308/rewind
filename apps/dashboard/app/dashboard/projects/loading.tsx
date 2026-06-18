export default function ProjectsLoading() {
  return (
    <div className="flex flex-col gap-10 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="h-10 w-48 bg-white/5 rounded-lg mb-4" />
          <div className="h-6 w-64 bg-white/5 rounded-md" />
        </div>
        <div className="h-10 w-32 bg-white/5 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-[#0A0A0A] border border-[var(--color-border-dark)] flex flex-col h-[320px]">
            <div className="p-8 pb-6 border-b border-[var(--color-border-dark)] flex-1">
              <div className="flex justify-between items-start mb-12">
                <div className="w-12 h-12 rounded-full bg-white/5" />
                <div className="w-8 h-8 rounded-lg bg-white/5" />
              </div>
              <div className="h-6 w-32 bg-white/5 rounded mb-3" />
              <div className="h-3 w-24 bg-white/5 rounded" />
            </div>
            <div className="p-8 pt-6 bg-[#050505] h-[120px]">
              <div className="h-3 w-32 bg-white/5 rounded mb-4" />
              <div className="h-10 w-full bg-white/5 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
