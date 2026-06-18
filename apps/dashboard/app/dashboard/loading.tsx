export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 pb-10 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="h-12 w-64 bg-white/5 rounded-lg mb-4" />
          <div className="h-6 w-48 bg-white/5 rounded-md" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="h-14 w-full bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-xl" />

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col mt-4">
        <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl relative overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Header Row */}
          <div className="hidden lg:grid grid-cols-12 gap-6 px-8 py-6 border-b border-[var(--color-border-dark)] bg-black/40">
            <div className="col-span-5 h-4 bg-white/5 rounded w-32" />
            <div className="col-span-3 h-4 bg-white/5 rounded w-24" />
            <div className="col-span-2 h-4 bg-white/5 rounded w-20" />
            <div className="col-span-2 h-4 bg-white/5 rounded w-24" />
          </div>

          {/* Rows */}
          <div className="flex-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 lg:items-center px-6 py-6 lg:px-8 border-b border-[var(--color-border-dark)]">
                <div className="lg:col-span-5 flex items-center gap-5">
                  <div className="w-10 h-10 rounded-full bg-white/5 shrink-0" />
                  <div className="flex-1">
                    <div className="h-5 bg-white/5 rounded w-48 mb-2" />
                    <div className="flex gap-2">
                      <div className="h-4 bg-white/5 rounded w-16" />
                      <div className="h-4 bg-white/5 rounded w-24" />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-7 grid grid-cols-2 lg:grid-cols-7 gap-4 lg:gap-0">
                  <div className="col-span-1 lg:col-span-3 flex flex-col gap-2">
                    <div className="h-4 bg-white/5 rounded w-24" />
                    <div className="h-3 bg-white/5 rounded w-20" />
                  </div>
                  <div className="col-span-1 lg:col-span-2 flex flex-col gap-2 lg:pr-6">
                    <div className="h-4 bg-white/5 rounded w-16" />
                    <div className="hidden lg:block h-1.5 w-full bg-white/5 rounded-full" />
                  </div>
                  <div className="col-span-2 lg:col-span-2 flex items-center justify-between">
                    <div className="h-4 bg-white/5 rounded w-24" />
                    <div className="hidden lg:block w-8 h-8 rounded-full bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
