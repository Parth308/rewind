'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Clock, ArrowRight, Monitor, MousePointerClick, AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { FadeUp } from '@/components/ui/fade-up';
import { formatDistanceToNow } from 'date-fns';

export default function SearchClient({ projectId }: { projectId: string | null }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try { setRecentSearches(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || !projectId) return;
    
    const newRecents = [searchQuery, ...recentSearches.filter(q => q !== searchQuery)].slice(0, 5);
    setRecentSearches(newRecents);
    localStorage.setItem('recentSearches', JSON.stringify(newRecents));

    setQuery(searchQuery);
    setIsSearching(true);
    setHasSearched(true);
    setResults([]);

    try {
      const res = await fetch('/api/sessions/search-semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, projectId }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      } else {
        console.error('Search failed:', data.error);
      }
    } catch (err) {
      console.error('Network error during search', err);
    } finally {
      setIsSearching(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  return (
    <div className="flex flex-col gap-10 pb-10 min-h-[calc(100vh-10rem)] relative">
      
      {/* Animated Header Area */}
      <motion.div
        animate={{ 
          marginTop: hasSearched ? '0vh' : '20vh',
          scale: hasSearched ? 0.95 : 1
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex flex-col items-center justify-center w-full"
      >
        <motion.div layout className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/30 shadow-[0_0_15px_rgba(163,230,53,0.3)]">
            <Sparkles className="w-6 h-6 text-[var(--color-accent-green)]" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white">Semantic Search.</h1>
        </motion.div>

        {/* Search Bar */}
        <motion.div layout className="w-full max-w-3xl relative z-20">
          <div className="relative group">
            <div className="absolute -inset-1 bg-[var(--color-accent-green)] opacity-0 group-focus-within:opacity-20 rounded-2xl blur-xl transition-all duration-500" />
            <div className="relative flex items-center bg-[#0A0A0A] border border-[var(--color-border-dark)] group-focus-within:border-[var(--color-accent-green)]/50 rounded-2xl overflow-hidden shadow-2xl transition-all">
              <div className="pl-6 text-neutral-500 group-focus-within:text-[var(--color-accent-green)] transition-colors">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Describe what you want to find... e.g., 'Rage clicks on checkout'"
                className="w-full bg-transparent border-none outline-none py-5 px-6 text-xl text-white placeholder:text-neutral-600 font-sans tracking-wide"
              />
              <button 
                onClick={() => handleSearch(query)}
                disabled={!query.trim()}
                className="mr-3 p-3 bg-white text-black rounded-xl hover:bg-[var(--color-accent-green)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group-focus-within:bg-[var(--color-accent-green)] flex items-center justify-center shadow-lg"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recent Searches */}
        <AnimatePresence>
          {!hasSearched && recentSearches.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-12 w-full max-w-2xl text-center"
            >
              <div className="flex items-center justify-center gap-2 text-xs font-mono tracking-[0.2em] text-neutral-500 mb-6 uppercase font-bold">
                <Clock className="w-4 h-4" /> Recent Queries
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {recentSearches.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(sq)}
                    className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-white/[0.04] border border-[var(--color-border-dark)] hover:border-neutral-700 rounded-full text-sm text-neutral-300 transition-all shadow-sm"
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results Area */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full flex-1"
          >
            {isSearching ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 w-full bg-[#0A0A0A]/50 border border-[var(--color-border-dark)] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center text-neutral-500 mt-20 font-mono text-sm tracking-widest uppercase">
                No matching records found in the databank.
              </div>
            ) : (
              <FadeUp className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl relative overflow-hidden shadow-2xl">
                {/* Ambient Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
                
                <div className="px-8 py-5 border-b border-[var(--color-border-dark)] bg-black/40 relative z-10 backdrop-blur-md flex justify-between items-center">
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--color-accent-green)] font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent-green)] shadow-[0_0_8px_var(--color-accent-green)] animate-pulse" />
                    {results.length} Semantically Matched Sessions
                  </span>
                </div>

                <div className="flex flex-col relative z-10">
                  {results.map((result, i) => {
                    const session = result.session;
                    const dur = session.durationMs;
                    const durStr = dur
                      ? dur >= 60000
                        ? `${Math.floor(dur / 60000)}m ${Math.round((dur % 60000) / 1000)}s`
                        : `${Math.round(dur / 1000)}s`
                      : '—';
                    
                    return (
                      <Link key={i} href={`/dashboard/sessions/${session.id}`}>
                        <div className="group border-b border-[var(--color-border-dark)] last:border-0 hover:bg-white/[0.04] p-6 lg:p-8 transition-all relative cursor-pointer">
                          {/* Hover indicator */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-accent-green)] opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(163,230,53,0.5)]" />
                          
                          <div className="flex flex-col lg:flex-row gap-6 lg:items-start justify-between">
                            
                            {/* Metadata Column */}
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="font-mono text-lg text-white group-hover:text-[var(--color-accent-green)] transition-colors truncate">
                                  {session.id}
                                </span>
                                
                                {/* Match Score */}
                                <div className="text-[10px] text-[var(--color-accent-green)] font-mono bg-[var(--color-accent-green)]/10 px-2 py-0.5 rounded border border-[var(--color-accent-green)]/20 shadow-[0_0_10px_rgba(163,230,53,0.2)]">
                                  {((1 - result.distance) * 100).toFixed(1)}% MATCH
                                </div>
                                
                                {session.hasRageClicks && (
                                  <div className="flex items-center gap-1 text-[10px] text-orange-400 font-mono bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                    <MousePointerClick className="w-3 h-3" /> RAGE
                                  </div>
                                )}
                                {(session.errorCount ?? 0) > 0 && (
                                  <div className="flex items-center gap-1 text-[10px] text-red-400 font-mono bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                    <AlertTriangle className="w-3 h-3" /> ERRORS
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-6 text-sm text-neutral-400 font-mono mb-4">
                                <span className="flex items-center gap-2"><Monitor className="w-4 h-4 text-neutral-500" /> {session.browser || 'Unknown'}</span>
                                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-neutral-500" /> {durStr}</span>
                                <span>{session.startedAt ? formatDistanceToNow(new Date(session.startedAt), { addSuffix: true }) : ''}</span>
                              </div>

                              {/* AI Narrative Box */}
                              <div className="bg-black/50 border border-white/5 rounded-xl p-5 group-hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-neutral-500 mb-2 uppercase tracking-[0.1em]">
                                  <Sparkles className="w-3 h-3 text-[var(--color-accent-green)]" /> Narrative Analysis
                                </div>
                                <p className="text-sm leading-relaxed text-neutral-300 font-sans">
                                  {result.narrative}
                                </p>
                              </div>

                            </div>
                            
                            {/* Action Column */}
                            <div className="hidden lg:flex flex-col items-end justify-center shrink-0">
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 border border-white/10 group-hover:border-[var(--color-accent-green)]/50 group-hover:shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                                <ChevronRight className="w-5 h-5 text-[var(--color-accent-green)]" />
                              </div>
                            </div>

                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </FadeUp>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
