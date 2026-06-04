"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyToken({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full bg-black/50 border border-[var(--color-border-dark)] rounded-lg p-3 text-left group transition-all hover:border-[var(--color-accent-green)]/40 hover:bg-black/70"
      title="Click to copy token"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-neutral-500">Project Token</span>
        <span className="flex items-center gap-1 text-[10px] transition-colors text-neutral-600 group-hover:text-[var(--color-accent-green)]">
          {copied ? (
            <>
              <Check className="h-3 w-3 text-[var(--color-accent-green)]" />
              <span className="text-[var(--color-accent-green)]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              click to copy
            </>
          )}
        </span>
      </div>
      <code className="text-xs font-mono text-[var(--color-accent-green)] truncate block w-full">
        {token}
      </code>
    </button>
  );
}
