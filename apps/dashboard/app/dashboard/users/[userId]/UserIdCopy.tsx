'use client';

import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

export function UserIdCopy({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
      title="Copy User ID"
    >
      {copied ? <CheckCircle2 className="w-5 h-5 text-[var(--color-accent-green)]" /> : <Copy className="w-5 h-5" />}
    </button>
  );
}
