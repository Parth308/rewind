'use client';

import { useState } from 'react';
import { Share2, Check, AlertCircle } from 'lucide-react';
import { createShareToken } from '@/app/actions/share';

export function ShareButton({ sessionId }: { sessionId: string }) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const res = await createShareToken(sessionId);
      if (res.token) {
        const url = `${window.location.origin}/share/${res.token}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        setError(true);
        setTimeout(() => setError(false), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-mono transition-colors relative z-10 shadow-sm ${
        error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-[#111] hover:bg-[#1a1a1a] border-[var(--color-border-dark)] text-neutral-400 hover:text-white'
      }`}
    >
      {error ? <AlertCircle className="w-3.5 h-3.5" /> : copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
      {isSharing ? 'GENERATING...' : error ? 'FAILED' : copied ? 'COPIED LINK' : 'SHARE'}
    </button>
  );
}
