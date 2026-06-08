'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Clock, ArrowRight, Monitor, MousePointerClick, AlertTriangle, ChevronRight, CornerUpLeft, ChevronsUpDown, Flame, Globe, User, Folder } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FadeUp } from '@/components/ui/fade-up';
import { formatDistanceToNow } from 'date-fns';

export default function SearchClient({ projectId }: { projectId: string | null }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try { setRecentSearches(JSON.parse(saved)); } catch (e) { }
    }
  }, []);

  useEffect(() => {
    const fetchAutocomplete = async () => {
      if (!query.trim() || query.length < 2 || !projectId) {
        setAutocompleteResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/users/autocomplete?projectId=${projectId}&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.results) {
          setAutocompleteResults(data.results);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const debounceTimer = setTimeout(fetchAutocomplete, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, projectId]);

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
    <div className="flex flex-col gap-10 pb-10 min-h-[calc(100vh-10rem)]">

      {/* Header Area */}
      <FadeUp>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">Semantic Search.</h1>
            <p className="text-lg text-white/[0.618] max-w-xl">
              Query your databank using natural language to uncover complex user behaviors.
            </p>
          </div>
        </div>
      </FadeUp>

      {/* Search Bar */}
      <FadeUp delay={0.1} className="w-full relative z-20">
        <div className="relative group">
          {/* Ambient Glow */}
          <div className="absolute -inset-1 bg-[var(--color-accent-green)] opacity-0 group-focus-within:opacity-[0.15] blur-2xl transition-all duration-700 pointer-events-none rounded-full" />

          <div className="relative flex items-center bg-[#0A0A0A] border border-[var(--color-border-dark)] group-focus-within:border-[var(--color-accent-green)]/50 rounded-2xl overflow-hidden shadow-2xl transition-all glass">
            <div className="pl-6 text-neutral-500 group-focus-within:text-[var(--color-accent-green)] transition-colors">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setShowAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              placeholder="Find sessions where users rage clicked on checkout..."
              className="w-full bg-transparent border-none outline-none py-6 px-6 text-xl text-white placeholder:text-neutral-600 font-sans tracking-wide"
            />
            <button
              onClick={() => handleSearch(query)}
              disabled={!query.trim()}
              className="mr-3 p-4 bg-white text-black rounded-xl hover:bg-[var(--color-accent-green)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group-focus-within:bg-[var(--color-accent-green)] flex items-center justify-center shadow-lg"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {showAutocomplete && autocompleteResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-xl overflow-hidden shadow-2xl z-50"
              >
                <div className="p-3 text-xs font-mono text-neutral-500 uppercase tracking-widest border-b border-[var(--color-border-dark)] flex items-center gap-2">
                  <User className="w-3 h-3" /> Jump to User Profile
                </div>
                {autocompleteResults.map((userId) => (
                  <Link key={userId} href={`/dashboard/users/${encodeURIComponent(userId)}`}>
                    <div className="px-4 py-3 hover:bg-[var(--color-accent-green)]/10 hover:text-[var(--color-accent-green)] cursor-pointer flex items-center gap-3 transition-colors text-white font-mono">
                      <span>{userId}</span>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </FadeUp>

      {/* Recent Searches */}
      <AnimatePresence>
        {!hasSearched && recentSearches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-2 w-full text-left"
          >
            <div className="flex items-center gap-2 text-xs font-mono tracking-[0.2em] text-neutral-500 mb-4 uppercase font-bold">
              <Clock className="w-4 h-4" /> Recent Queries
            </div>
            <div className="flex flex-wrap gap-3">
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
                  <div key={i} className="h-40 w-full bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="relative overflow-hidden rounded-2xl p-16 text-center flex flex-col items-center justify-center bg-[#0A0A0A] border border-[var(--color-border-dark)] min-h-[400px] shadow-2xl">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] opacity-30 pointer-events-none" />
                <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,255,255,0.05)] relative z-10">
                  <Search className="w-6 h-6 text-neutral-600" />
                </div>
                <h3 className="text-3xl font-serif font-bold text-white mb-4 relative z-10">No matches found.</h3>
                <p className="text-neutral-500 max-w-md text-lg relative z-10">
                  We couldn't find any sessions matching this semantic description in your databank.
                </p>
              </div>
            ) : (
              <FadeUp className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl relative overflow-hidden shadow-2xl flex flex-col">
                {/* Ambient Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--color-accent-green)] opacity-[0.02] blur-[100px] pointer-events-none rounded-full" />

                <div className="px-8 py-6 border-b border-[var(--color-border-dark)] bg-black/40 relative z-10 backdrop-blur-md flex justify-between items-center">
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--color-accent-green)] font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent-green)] shadow-[0_0_8px_var(--color-accent-green)] animate-pulse" />
                    {results.length} Semantically Matched Sessions
                  </span>
                </div>

                {(() => {
                  const uniqueUsers = Array.from(new Set(results.map(r => r.session.userId || (r.session.metadata as any)?.userId).filter(Boolean)));
                  if (uniqueUsers.length === 0) return null;
                  
                  return (
                    <div className="flex flex-col relative z-10 border-b-4 border-black">
                      <div className="px-8 py-4 border-b border-[var(--color-border-dark)] bg-black/40 relative z-10 backdrop-blur-md flex justify-between items-center">
                        <span className="text-xs font-mono uppercase tracking-[0.2em] text-white font-bold flex items-center gap-2">
                          <User className="w-4 h-4 text-white" />
                          {uniqueUsers.length} Involved User{uniqueUsers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {uniqueUsers.map((userId: any, i) => (
                        <Link key={userId} href={`/dashboard/users/${encodeURIComponent(userId)}`}>
                          <div className="group border-b border-[var(--color-border-dark)] last:border-b-0 hover:bg-white/[0.04] p-6 lg:p-8 transition-all relative cursor-pointer">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-colors">
                                  <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <div className="font-mono text-lg text-white">
                                    {userId}
                                  </div>
                                  <div className="text-sm text-neutral-500 font-sans mt-1">
                                    User profile matched based on underlying session behavior.
                                  </div>
                                </div>
                              </div>
                              <div className="hidden lg:flex flex-col items-end justify-center shrink-0">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 border border-white/10 group-hover:border-white/30">
                                  <ChevronRight className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  );
                })()}

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
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link href={`/dashboard/sessions/${session.id}`}>
                          <div className="group border-b border-[var(--color-border-dark)] last:border-b-0 hover:bg-white/[0.04] p-6 lg:p-8 transition-all relative cursor-pointer">
                            {/* Hover indicator */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-accent-green)] opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(163,230,53,0.5)]" />

                            <div className="flex flex-col lg:flex-row gap-6 lg:items-start justify-between">

                              {/* Metadata Column */}
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                  <span className="font-mono text-base lg:text-lg text-white group-hover:text-[var(--color-accent-green)] transition-colors truncate">
                                    {session.id}
                                  </span>

                                  {(session.userId || (session.metadata as any)?.userId) && (() => {
                                    const uid = session.userId || (session.metadata as any)?.userId;
                                    return (
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          router.push(`/dashboard/users/${encodeURIComponent(uid)}`);
                                        }}
                                        className="flex items-center gap-1.5 text-[10px] lg:text-xs text-[var(--color-accent-green)] font-mono bg-[var(--color-accent-green)]/10 px-2 py-0.5 rounded border border-[var(--color-accent-green)]/20 shadow-[0_0_10px_rgba(163,230,53,0.1)] hover:bg-[var(--color-accent-green)]/20 transition-colors z-20 relative cursor-pointer"
                                      >
                                        <User className="w-3 h-3" /> 
                                        {uid.length > 30 && uid.includes('-') 
                                          ? `${uid.substring(0, 8)}...${uid.substring(uid.length - 4)}` 
                                          : uid}
                                      </button>
                                    );
                                  })()}

                                  {projectId === 'all' && result.projectName && (
                                    <div className="text-[10px] lg:text-xs text-neutral-300 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                                      <Folder className="w-3 h-3 text-neutral-400" /> {result.projectName}
                                    </div>
                                  )}

                                  {/* Match Score */}
                                  <div className="text-[10px] text-[var(--color-accent-green)] font-mono bg-[var(--color-accent-green)]/10 px-2 py-0.5 rounded border border-[var(--color-accent-green)]/20 shadow-[0_0_10px_rgba(163,230,53,0.2)]">
                                    {((1 - result.distance) * 100).toFixed(1)}% MATCH
                                  </div>

                                  {(session.errorCount ?? 0) > 0 ? (
                                    <div className="text-[10px] lg:text-xs text-red-400 font-mono bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                      {session.errorCount} ERRORS
                                    </div>
                                  ) : null}
                                  {session.hasRageClicks && (
                                    <div className="flex items-center gap-1 text-[10px] lg:text-xs text-orange-400 font-mono bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                      <Flame className="w-3 h-3" /> RAGE
                                    </div>
                                  )}
                                  {session.hasDeadClicks && (
                                    <div className="flex items-center gap-1 text-[10px] lg:text-xs text-yellow-400 font-mono bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                                      <MousePointerClick className="w-3 h-3" /> DEAD CLICK
                                    </div>
                                  )}
                                  {session.hasUTurns && (
                                    <div className="flex items-center gap-1 text-[10px] lg:text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                      <CornerUpLeft className="w-3 h-3" /> U-TURN
                                    </div>
                                  )}
                                  {session.hasWildScrolling && (
                                    <div className="flex items-center gap-1 text-[10px] lg:text-xs text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                      <ChevronsUpDown className="w-3 h-3" /> SCROLL
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-400 font-mono mb-5">
                                  <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-neutral-500" /> {session.browser || 'Unknown'}</span>
                                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-neutral-500" /> {durStr}</span>
                                  <span className="text-neutral-500">{session.startedAt ? formatDistanceToNow(new Date(session.startedAt), { addSuffix: true }) : ''}</span>
                                </div>

                                {/* AI Narrative Box */}
                                <div className="bg-[#111]/80 border border-white/5 rounded-xl p-5 group-hover:border-white/10 transition-colors relative overflow-hidden">
                                  <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-purple-500/50 group-hover:bg-purple-400 transition-colors" />
                                  <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-neutral-500 mb-2 uppercase tracking-[0.1em] ml-2">
                                    <Sparkles className="w-3 h-3 text-purple-400" /> Narrative Analysis
                                  </div>
                                  <p className="text-sm leading-relaxed text-neutral-300 font-sans ml-2">
                                    {result.narrative}
                                  </p>
                                </div>

                              </div>

                              {/* Action Column */}
                              <div className="hidden lg:flex flex-col items-end justify-center shrink-0">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 border border-white/10 group-hover:border-[var(--color-accent-green)]/50 group-hover:shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                                  <ChevronRight className="w-5 h-5 text-[var(--color-accent-green)]" />
                                </div>
                              </div>

                            </div>
                          </div>
                        </Link>
                      </motion.div>
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
