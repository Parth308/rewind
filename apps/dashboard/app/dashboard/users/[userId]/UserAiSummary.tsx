'use client';

import { useState } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { Bot, Sparkles, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function UserAiSummary({ userId, projectId }: { userId: string, projectId: string }) {
  const { completion, complete, isLoading, error } = useCompletion({
    api: '/api/users/summarize',
    body: { userId, projectId }
  });

  const [hasStarted, setHasStarted] = useState(false);

  const handleGenerate = () => {
    setHasStarted(true);
    complete('');
  };

  if (!hasStarted) {
    return (
      <div className="bg-gradient-to-r from-[var(--color-accent-green)]/10 to-transparent border border-[var(--color-accent-green)]/20 rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-white font-mono font-bold mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-accent-green)]" />
            Customer Support AI Brief
          </h3>
          <p className="text-sm text-neutral-400">Generate an AI analysis of this user's lifetime behavior to instantly identify friction points and recent problems.</p>
        </div>
        <button 
          onClick={handleGenerate}
          className="bg-[var(--color-accent-green)] text-black px-4 py-2 rounded-lg font-mono text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
        >
          <Bot className="w-4 h-4" /> GENERATE BRIEF
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] border border-[var(--color-accent-green)]/30 rounded-xl p-6 shadow-[0_0_30px_rgba(163,230,53,0.05)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-accent-green)] to-transparent opacity-50" />
      
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[var(--color-accent-green)]" />
          <h3 className="text-white font-mono font-bold uppercase tracking-wider">AI Support Brief</h3>
          {isLoading && (
            <span className="ml-2 flex items-center gap-1 text-xs text-[var(--color-accent-green)] font-mono animate-pulse">
              <span className="w-1.5 h-1.5 bg-[var(--color-accent-green)] rounded-full"></span>
              ANALYZING...
            </span>
          )}
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 text-red-400 bg-red-400/10 p-4 rounded-lg border border-red-400/20">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-mono">{error.message || 'Failed to generate brief.'}</p>
        </div>
      ) : (
        <div className="prose prose-invert prose-green max-w-none font-mono text-sm leading-relaxed prose-headings:font-mono prose-headings:uppercase prose-headings:tracking-widest prose-a:text-[var(--color-accent-green)]">
          {completion ? (
            <ReactMarkdown>{completion}</ReactMarkdown>
          ) : (
            <div className="h-20 flex items-center text-neutral-500">Reading session narratives...</div>
          )}
        </div>
      )}
    </div>
  );
}
