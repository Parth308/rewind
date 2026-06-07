"use client";

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'bash' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 border border-[var(--color-border-dark)] rounded-xl bg-[#050505] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-[var(--color-border-dark)]">
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-neutral-400 hover:text-[var(--color-accent-green)] transition-colors rounded-md hover:bg-[var(--color-accent-green)]/10"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'COPIED!' : 'COPY'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        {/* We use !important modifiers here to safely override the global [&_pre] styles from layout.tsx */}
        <pre className="!bg-transparent !border-0 !p-0 !m-0 !rounded-none">
          <code className="text-sm font-mono text-neutral-300">{code}</code>
        </pre>
      </div>
    </div>
  );
}
