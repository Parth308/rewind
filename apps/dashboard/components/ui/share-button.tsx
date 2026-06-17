'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { createShareToken } from '@/app/actions/share';

export function ShareButton({ sessionId }: { sessionId: string }) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

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
        alert(res.error || 'Failed to share');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate share link');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="flex items-center gap-2 px-3 py-1.5 bg-[#111] hover:bg-[#1a1a1a] border border-[var(--color-border-dark)] rounded-lg text-xs font-mono text-neutral-400 hover:text-white transition-colors relative z-10 shadow-sm"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
      {isSharing ? 'GENERATING...' : copied ? 'COPIED LINK' : 'SHARE'}
    </button>
  );
}
