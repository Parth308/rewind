export default function UserProfileLoading() {
  return (
    <div className="flex flex-col gap-10 pb-10 min-h-[calc(100vh-10rem)] animate-pulse">
      <div className="h-4 w-32 bg-white/5 rounded" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/5" />
            <div className="h-10 w-64 bg-white/5 rounded-lg" />
          </div>
          <div className="h-6 w-48 bg-white/5 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-xl p-5">
            <div className="h-3 w-24 bg-white/5 rounded mb-3" />
            <div className="h-6 w-32 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-6 h-[120px]" />

      <div>
        <div className="h-4 w-48 bg-white/5 rounded mb-8" />
        <div className="flex flex-col gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between md:justify-normal md:odd:flex-row-reverse">
              <div className="w-10 h-10 rounded-full bg-white/5 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] h-[140px] rounded-xl bg-[#0A0A0A] border border-[var(--color-border-dark)] p-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
