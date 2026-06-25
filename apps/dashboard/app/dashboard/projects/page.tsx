import { Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import { projects, sessions } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { CreateProjectButton } from './create-project-button';
import { CopyToken } from './copy-token';
import { deleteProject } from './actions';
import { FadeUp } from '@/components/ui/fade-up';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const allProjects = await db.select().from(projects);

  const connectionStatuses = await Promise.all(allProjects.map(async (project) => {
    const sessionExists = await db.select({ id: sessions.id })
                                .from(sessions)
                                .where(eq(sessions.projectId, project.id))
                                .limit(1);
    return sessionExists.length > 0;
  }));

  return (
    <div className="flex flex-col gap-10">
      <FadeUp>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="font-sans text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">Project nodes.</h1>
            <p className="text-lg text-white/[0.618] max-w-xl">Configure tracker instances and generate ingestion tokens.</p>
          </div>
          <CreateProjectButton />
        </div>
      </FadeUp>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {allProjects.map((project, index) => {
          const isConnected = connectionStatuses[index];

          return (
            <FadeUp key={project.id} delay={index * 0.1}>
              <div className="relative overflow-hidden rounded-2xl bg-[#0A0A0A] border border-[var(--color-border-dark)] flex flex-col transition-all group hover:border-white/20 h-full">
                {/* Ambient node glow */}
                <div className={`absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 opacity-5 blur-[80px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-10 ${isConnected ? 'bg-[var(--color-accent-green)]' : 'bg-amber-500'}`} />
                
                {/* Top Section */}
                <div className="p-8 pb-6 border-b border-[var(--color-border-dark)] relative z-10 flex-1">
                  <div className="flex justify-between items-start mb-12">
                    {/* Status Ring */}
                    <div className="relative flex items-center justify-center w-12 h-12">
                      <div className={`absolute inset-0 rounded-full border border-dashed ${isConnected ? 'border-[var(--color-accent-green)]/40 animate-[spin_10s_linear_infinite]' : 'border-amber-500/40'}`} />
                      <div className={`absolute inset-2 rounded-full border ${isConnected ? 'border-[var(--color-accent-green)]/20 animate-[spin_15s_linear_infinite_reverse]' : 'border-amber-500/20'}`} />
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[var(--color-accent-green)] shadow-[0_0_10px_var(--color-accent-green)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                    </div>

                    {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? (
                      <button
                        type="button"
                        className="text-neutral-600 cursor-not-allowed opacity-50 p-2 rounded-lg"
                        title="Delete disabled in Demo Mode"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <form action={deleteProject.bind(null, project.id)}>
                        <button
                          type="submit"
                          className="text-neutral-600 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                          title="Delete project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                  </div>

                  <h3 className="font-sans text-2xl font-bold text-white mb-2">{project.name}</h3>
                  <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-neutral-500">
                    {isConnected ? 'Signal acquired' : 'Awaiting telemetry'}
                  </div>
                </div>

                {/* Bottom Section - Token & Snippet */}
                <div className="p-8 pt-6 relative z-10 bg-[#050505]">
                  <div className="mb-6">
                    <div className="text-[10px] font-mono tracking-[0.2em] text-neutral-600 mb-3">INGESTION TOKEN</div>
                    <CopyToken token={project.token} />
                  </div>

                  {/* Terminal Snippet */}
                  <div className="border border-[var(--color-border-dark)] rounded-xl bg-[#0A0A0A] overflow-hidden">
                    <div className="bg-[#111] px-3 py-2 flex items-center gap-1.5 border-b border-[var(--color-border-dark)]">
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                      <div className="ml-2 text-[10px] font-mono text-neutral-600 tracking-wider">rewind.config.js</div>
                    </div>
                    <div className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto">
                      <span className="text-pink-400">window</span>
                      <span className="text-white">.</span>
                      <span className="text-blue-400">__rewind</span>
                      <span className="text-white"> = {'{'}</span>
                      <br />
                      <span className="text-white ml-4">token: </span>
                      <span className="text-[var(--color-accent-green)]">'{project.token.substring(0, 12)}...'</span>
                      <span className="text-white">,</span>
                      <br />
                      <span className="text-white ml-4">endpoint: </span>
                      <span className="text-[var(--color-accent-green)]">'http://localhost:3001/ingest'</span>
                      <span className="text-white">,</span>
                      <br />
                      <span className="text-white">{'}'};</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          );
        })}

        {allProjects.length === 0 && (
          <FadeUp delay={0.1} className="col-span-full">
            <div className="relative overflow-hidden rounded-2xl p-16 text-center flex flex-col items-center justify-center bg-[#0A0A0A] border border-[var(--color-border-dark)] min-h-[500px]">
              {/* Massive abstract node in background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] opacity-30" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-[0.5px] border-white/5 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] border-[0.5px] border-dashed border-white/5 rounded-full" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                  <div className="w-3 h-3 rounded-full bg-neutral-600 shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                </div>
                
                <h3 className="text-3xl font-sans font-bold text-white mb-4">No nodes active.</h3>
                <p className="text-neutral-500 max-w-md mb-8 text-lg">
                  Initialize your first project to generate an ingestion token and start receiving telemetry.
                </p>
                <CreateProjectButton />
              </div>
            </div>
          </FadeUp>
        )}
      </div>
    </div>
  );
}
