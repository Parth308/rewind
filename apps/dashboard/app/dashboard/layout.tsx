import { Sidebar } from '@/components/ui/sidebar';

async function checkIngestorHealth() {
  try {
    const serverUrl = process.env.NODE_ENV === 'production' ? 'http://ingestor:3001' : 'http://localhost:3001';
    const res = await fetch(`${serverUrl}/health`, { next: { revalidate: 10 } });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isLive = await checkIngestorHealth();

  return (
    <div className="flex h-screen bg-[#050505] font-sans text-[#fdfdfc] selection:bg-[var(--color-accent-green)]/30">
      {/* Ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-start justify-center overflow-hidden">
        <div className="w-[800px] h-[400px] bg-[var(--color-accent-green)] opacity-[0.03] blur-[120px] rounded-full -translate-y-1/2" />
      </div>

      <Sidebar isLive={isLive} />

      {/* Content — flex-col, takes remaining width, scrolls vertically */}
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto overflow-x-hidden w-0">
        {/* w-0 + flex-1 = takes remaining space without overflowing */}
        <main className="flex-1 p-4 pt-24 md:p-10 lg:p-12 w-full max-w-7xl mx-auto flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}