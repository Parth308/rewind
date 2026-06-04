import { LayoutTemplate, Trash2, Plus, Zap } from 'lucide-react';
import { db } from '@/lib/db';
import { projects } from '@rewind/shared';
import { CreateProjectButton } from './create-project-button';
import { CopyToken } from './copy-token';
import { deleteProject } from './actions';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const allProjects = await db.select().from(projects);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-1">Projects</h1>
          <p className="text-sm text-neutral-400">Manage your tracking applications and tokens.</p>
        </div>
        <CreateProjectButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {allProjects.map((project) => (
          <div key={project.id} className="glass relative overflow-hidden rounded-2xl p-6 flex flex-col gap-5 transition-all hover:bg-white/[0.04] group border border-[var(--color-border-dark)]">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-[var(--color-accent-green)] opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)] flex items-center justify-center shrink-0 border border-[var(--color-accent-green)]/20 shadow-[inset_0_1px_0_rgba(163,230,53,0.2)]">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <form action={deleteProject.bind(null, project.id)}>
                <button
                  type="submit"
                  className="text-neutral-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="relative z-10">
              <h3 className="font-serif text-xl font-bold text-white mb-1">{project.name}</h3>
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-green)] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent-green)]" />
                </div>
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Active</span>
              </div>
            </div>

            <div className="relative z-10">
              <CopyToken token={project.token} />
            </div>

            <div className="border-t border-white/5 pt-5 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-[var(--color-accent-green)]" />
                <p className="text-xs text-neutral-300 font-medium">Quick Install Snippet</p>
              </div>
              <div className="bg-[#050505] rounded-xl p-4 border border-white/5 shadow-inner">
                <pre className="font-mono text-[11px] text-neutral-400 overflow-x-auto whitespace-pre leading-relaxed">
{`window.__rewind = {
  token: '${project.token.substring(0, 16)}...',
  endpoint: 'http://localhost:3001/ingest',
};`}
                </pre>
              </div>
            </div>
          </div>
        ))}

        {allProjects.length === 0 && (
          <div className="col-span-full glass relative overflow-hidden rounded-2xl p-16 text-center flex flex-col items-center justify-center border-dashed border-2 border-white/10 bg-transparent min-h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent-green)]/[0.02] to-transparent pointer-events-none" />
            
            <div className="h-20 w-20 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 relative shadow-2xl">
              <div className="absolute inset-0 bg-[var(--color-accent-green)] opacity-5 blur-xl rounded-full" />
              <LayoutTemplate className="h-10 w-10 text-neutral-500 relative z-10" />
            </div>
            
            <h3 className="text-2xl font-serif font-bold text-white mb-3">No projects yet</h3>
            <p className="text-base text-neutral-400 max-w-md mb-8 leading-relaxed">
              Create your first project to generate a tracking token. You'll need this token to initialize the tracker in your application.
            </p>
            <CreateProjectButton />
          </div>
        )}
      </div>
    </div>
  );
}
