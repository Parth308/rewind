import { Sidebar } from '@/components/ui/sidebar';

async function checkIngestorHealth() {
  try {
    const serverUrl = process.env.NODE_ENV === 'production' ? 'http://ingestor:3001' : 'http://localhost:3001';
    // Using Next.js fetch cache with 10s revalidation so we don't bombard the ingestor
    const res = await fetch(`${serverUrl}/health`, { next: { revalidate: 10 } });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLive = await checkIngestorHealth();

  return (
    <div className="flex h-screen bg-[#050505] font-sans text-[#fdfdfc] selection:bg-[var(--color-accent-green)]/30 overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-start justify-center overflow-hidden">
        <div className="w-[800px] h-[400px] bg-[var(--color-accent-green)] opacity-[0.03] blur-[120px] rounded-full -translate-y-1/2" />
      </div>

      <Sidebar isLive={isLive} />
      
      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto">
        <main className="flex-1 p-6 sm:p-8 animate-fade-in-up w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
