"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X, ChevronDown, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export function SessionFilters({
  browsers,
  oses,
  countries,
}: {
  browsers: string[];
  oses: string[];
  countries: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tagInput, setTagInput] = useState(searchParams.get('tag') || '');

  useEffect(() => {
    setTagInput(searchParams.get('tag') || '');
  }, [searchParams]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset page to 1 on filter change
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('?');
  };

  // Check if any filter other than 'page' is active
  const activeParams = new URLSearchParams(searchParams.toString());
  activeParams.delete('page');
  const hasFilters = activeParams.toString().length > 0;

  const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative group">
      {children}
      <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 group-hover:text-neutral-300 transition-colors" />
    </div>
  );

  const selectClasses = "appearance-none bg-[#111] border border-[var(--color-border-dark)] rounded-md pl-3 pr-8 py-1.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-[var(--color-accent-green)] hover:border-white/20 transition-all cursor-pointer shadow-inner";

  const isErrorsOnly = searchParams.get('hasErrors') === 'true';

  // Debounce the local input to the router
  useEffect(() => {
    const handler = setTimeout(() => {
      if (tagInput !== (searchParams.get('tag') || '')) {
        updateFilter('tag', tagInput);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [tagInput]);

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white/[0.01] border border-[var(--color-border-dark)] p-3 rounded-xl mb-6 shadow-sm">
      <div className="flex items-center gap-2 text-neutral-500 mr-2">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-mono uppercase tracking-widest font-bold">Filters</span>
      </div>

      <SelectWrapper>
        <select
          className={selectClasses}
          value={searchParams.get('browser') || ''}
          onChange={(e) => updateFilter('browser', e.target.value)}
        >
          <option value="">All Browsers</option>
          {browsers.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </SelectWrapper>

      <SelectWrapper>
        <select
          className={selectClasses}
          value={searchParams.get('os') || ''}
          onChange={(e) => updateFilter('os', e.target.value)}
        >
          <option value="">All OS</option>
          {oses.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </SelectWrapper>

      <SelectWrapper>
        <select
          className={selectClasses}
          value={searchParams.get('country') || ''}
          onChange={(e) => updateFilter('country', e.target.value)}
        >
          <option value="">All Countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </SelectWrapper>

      <SelectWrapper>
        <select
          className={selectClasses}
          value={searchParams.get('frustration') || ''}
          onChange={(e) => updateFilter('frustration', e.target.value)}
        >
          <option value="">Any Health</option>
          <option value="rage">Rage Clicks</option>
          <option value="dead">Dead Clicks</option>
          <option value="uturn">U-Turns</option>
          <option value="wild">Wild Scrolling</option>
        </select>
      </SelectWrapper>

      <label className="flex items-center gap-2.5 text-xs font-mono text-neutral-400 cursor-pointer hover:text-white transition-colors group ml-2">
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isErrorsOnly ? 'bg-[var(--color-accent-green)] border-[var(--color-accent-green)] shadow-[0_0_8px_rgba(163,230,53,0.3)]' : 'bg-[#111] border-[var(--color-border-dark)] group-hover:border-white/20 shadow-inner'}`}>
          {isErrorsOnly && <Check className="w-3 h-3 text-black stroke-[3]" />}
        </div>
        <input 
          type="checkbox"
          className="sr-only"
          checked={isErrorsOnly}
          onChange={(e) => updateFilter('hasErrors', e.target.checked ? 'true' : '')}
        />
        Errors Only
      </label>

      <input
        type="text"
        placeholder="Filter by tag..."
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        className="bg-[#111] border border-[var(--color-border-dark)] rounded-md px-3 py-1.5 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-[var(--color-accent-green)] hover:border-white/20 transition-all shadow-inner w-36 ml-2"
      />

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono text-neutral-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded hover:bg-red-500/10"
        >
          <X className="w-3 h-3" /> Clear Filters
        </button>
      )}
    </div>
  );
}
