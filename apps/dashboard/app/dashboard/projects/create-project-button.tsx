'use client';

import { useState, useRef } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { createProject } from './actions';

export function CreateProjectButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createProject(formData);
    setLoading(false);
    
    if (result?.error) {
      alert(result.error);
      return;
    }
    
    setOpen(false);
    formRef.current?.reset();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-[var(--color-accent-green)] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[var(--color-accent-green-hover)]"
      >
        <Plus className="h-4 w-4" />
        New Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 glass rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-sans text-2xl font-bold text-white">Create Project</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form ref={formRef} action={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium text-neutral-300">
                  Project Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. My Marketing Site"
                  required
                  minLength={2}
                  className="w-full rounded-lg border border-[var(--color-border-dark)] bg-black/50 px-4 py-3 text-white placeholder-neutral-600 focus:border-[var(--color-accent-green)] focus:outline-none transition-colors"
                />
                <p className="text-xs text-neutral-500">
                  This will be the display name for your tracking project. A unique token will be generated automatically.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-accent-green)] px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[var(--color-accent-green-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-[var(--color-border-dark)] px-4 py-2.5 text-sm font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
