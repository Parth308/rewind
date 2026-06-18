export default function SystemLoading() {
  return (
    <div className="flex flex-col gap-10 pb-10 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="h-12 w-64 bg-white/5 rounded-lg mb-4" />
          <div className="h-6 w-96 bg-white/5 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-8 h-[340px]">
             <div className="h-8 w-64 bg-white/5 rounded-md mb-10" />
             <div className="space-y-10">
               {[1,2,3].map(i => (
                 <div key={i}>
                   <div className="flex justify-between mb-3">
                     <div className="h-4 w-32 bg-white/5 rounded" />
                     <div className="h-6 w-24 bg-white/5 rounded" />
                   </div>
                   <div className="h-2 w-full bg-white/5 rounded-full" />
                 </div>
               ))}
             </div>
          </div>
          <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-8 h-[200px]">
            <div className="h-8 w-48 bg-white/5 rounded-md mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="bg-[#111] rounded-xl p-5 border border-white/5 h-[80px]" />
              ))}
            </div>
          </div>
        </div>

        <div className="h-full">
          <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-8 h-full flex flex-col">
            <div className="h-8 w-48 bg-white/5 rounded-md mb-8" />
            <div className="w-full h-[180px] bg-[#111] border border-white/5 rounded-lg mb-10" />
            <div className="space-y-6 flex-1">
               {[1,2,3,4].map(i => (
                 <div key={i} className="flex flex-col gap-2 border-b border-[var(--color-border-dark)] pb-4">
                   <div className="h-3 w-20 bg-white/5 rounded" />
                   <div className="h-6 w-32 bg-white/5 rounded" />
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
