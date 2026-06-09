'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Hash, ArrowRight } from 'lucide-react';
import { docsSearchIndex } from './search-index';
import { clsx } from 'clsx';

type SearchResult = {
  type: 'page' | 'heading';
  title: string;
  href: string;
  context: string;
};

export function DocsSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const results: SearchResult[] = [];
  if (query.trim().length > 0) {
    const q = query.toLowerCase();
    docsSearchIndex.forEach((page) => {
      const pageMatch = page.title.toLowerCase().includes(q) || 
                        page.description.toLowerCase().includes(q) || 
                        page.keywords.some(k => k.includes(q));
      
      if (pageMatch) {
        results.push({
          type: 'page',
          title: page.title,
          href: page.href,
          context: page.description
        });
      }

      page.headings.forEach(h => {
        if (h.name.toLowerCase().includes(q)) {
          results.push({
            type: 'heading',
            title: h.name,
            href: h.href,
            context: `In ${page.title}`
          });
        }
      });
    });
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        router.push(results[selectedIndex].href);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, router]);

  useEffect(() => {
    if (scrollRef.current && results.length > 0) {
      const activeEl = scrollRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, results.length]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl bg-[#0a0a0a] border border-[var(--color-border-dark)] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto flex flex-col"
            >
              <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--color-border-dark)] bg-[#050505]">
                <Search className="w-5 h-5 text-[var(--color-accent-green)] shrink-0 opacity-70" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Search documentation..."
                  className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-neutral-600"
                />
                <button onClick={onClose} className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-mono text-neutral-400 uppercase tracking-widest transition-colors">
                  Esc
                </button>
              </div>

              {query.length > 0 && results.length === 0 && (
                <div className="py-14 text-center">
                  <p className="text-neutral-500 font-mono text-sm">No results found for "{query}"</p>
                </div>
              )}

              {results.length > 0 && (
                <div ref={scrollRef} className="max-h-[60vh] overflow-y-auto p-2 scroll-smooth">
                  {results.map((res, i) => {
                    const isSelected = i === selectedIndex;
                    return (
                      <button
                        key={res.href + i}
                        onMouseEnter={() => setSelectedIndex(i)}
                        onClick={() => {
                          router.push(res.href);
                          onClose();
                        }}
                        className={clsx(
                          "w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left",
                          isSelected ? "bg-[var(--color-accent-green)]/10 border-[var(--color-accent-green)]/30 text-white" : "text-neutral-400 hover:text-neutral-300 border border-transparent"
                        )}
                        style={{ border: isSelected ? '1px solid rgba(163,230,53,0.3)' : undefined }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={clsx("p-2 rounded-lg shrink-0", isSelected ? "bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]" : "bg-white/5")}>
                            {res.type === 'page' ? <FileText className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={clsx("font-serif text-base tracking-tight truncate", isSelected ? "text-white" : "text-neutral-200")}>{res.title}</span>
                            <span className="text-xs font-mono text-neutral-500 truncate">{res.context}</span>
                          </div>
                        </div>
                        {isSelected && <ArrowRight className="w-4 h-4 text-[var(--color-accent-green)] shrink-0 ml-4" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {query.length === 0 && (
                <div className="py-8 px-4">
                  <div className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase mb-3 px-2">Quick Links</div>
                  <div className="grid grid-cols-2 gap-2">
                    {docsSearchIndex.slice(0, 4).map((page) => (
                      <button
                        key={page.href}
                        onClick={() => { router.push(page.href); onClose(); }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border-dark)] bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left"
                      >
                        <FileText className="w-4 h-4 text-neutral-500" />
                        <span className="font-serif text-sm text-neutral-300">{page.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
