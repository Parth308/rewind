"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { DocsSearch } from './search';

const nav = [
  { name: 'Overview', href: '/docs', exact: true },
  { name: 'Installation', href: '/docs/installation', exact: false },
  { name: 'AI Setup', href: '/docs/ai-setup', exact: false },
  { name: 'Hardware & Scaling', href: '/docs/scaling', exact: false },
  { name: 'Features', href: '/docs/features', exact: false },
  { name: 'Architecture', href: '/docs/architecture', exact: false },
  { name: 'User Profiles', href: '/docs/user-profiles', exact: false },
  { name: 'Authentication & Teams', href: '/docs/auth-teams', exact: false },
  { name: 'Data Privacy', href: '/docs/privacy', exact: false },
  { name: 'API Reference', href: '/docs/api-reference', exact: false },
  { name: 'Node.js SDK', href: '/docs/node-sdk', exact: false },
  { name: 'Troubleshooting', href: '/docs/troubleshooting', exact: false },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 flex items-center justify-between px-4 h-14 border-b border-[var(--color-border-dark)] bg-[#0A0A0A]/95 backdrop-blur-md z-30 shrink-0">
        <Link href="/docs" className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[#0a0a0a] font-black text-sm font-mono shadow-[0_0_15px_rgba(163,230,53,0.3)]"
            style={{ background: '#a3e635' }}
          >
            D
          </div>
          <span className="font-serif text-xl font-bold text-white tracking-tight">Rewind Docs</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 -mr-2 text-neutral-400 hover:text-white transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={clsx(
        "w-64 border-r border-[var(--color-border-dark)] bg-[#050505] flex flex-col shrink-0 overflow-hidden z-50 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "lg:relative lg:translate-x-0 lg:h-screen lg:sticky lg:top-0",
        "fixed inset-y-0 left-0 h-full",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />

        {/* Desktop Logo */}
        <div className="hidden lg:flex h-20 items-center px-6 border-b border-[var(--color-border-dark)] shrink-0 relative z-10 bg-[#050505]/80 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-4 group relative w-full">
            <div className="absolute inset-0 bg-[var(--color-accent-green)] blur-[25px] opacity-10 group-hover:opacity-40 transition-opacity" />
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-[#0a0a0a] font-black text-lg font-mono shadow-[0_0_20px_rgba(163,230,53,0.3)] relative z-10 shrink-0"
              style={{ background: '#a3e635' }}
            >
              R
            </div>
            <div className="flex flex-col relative z-10 min-w-0">
              <span className="font-serif text-xl font-bold text-white tracking-tight truncate">Rewind</span>
              <span className="text-[10px] font-mono tracking-widest text-[var(--color-accent-green)] uppercase truncate">Documentation</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 relative z-10">
          
          <button 
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 mb-8 rounded-xl border border-[var(--color-border-dark)] bg-white/[0.02] hover:bg-white/[0.06] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-neutral-500 group-hover:text-[var(--color-accent-green)] transition-colors" />
              <span className="text-sm font-mono text-neutral-400 group-hover:text-neutral-300">Search docs...</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="hidden lg:flex items-center justify-center h-5 px-1.5 rounded border border-white/10 bg-black/50 text-[10px] font-mono text-neutral-500 shadow-inner">Ctrl</kbd>
              <kbd className="hidden lg:flex items-center justify-center h-5 px-1.5 rounded border border-white/10 bg-black/50 text-[10px] font-mono text-neutral-500 shadow-inner">K</kbd>
            </div>
          </button>

          <div className="text-xs font-mono tracking-[0.2em] text-neutral-600 mb-6 px-3 uppercase font-bold">Contents</div>
          <div className="space-y-2 relative">
            {nav.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative group',
                    active ? 'text-white' : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.04]'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 bg-white/[0.08] border border-white/[0.1] rounded-xl -z-10 hidden lg:block"
                    />
                  )}
                  {active && (
                    <div className="absolute inset-0 bg-white/[0.08] border border-white/[0.1] rounded-xl -z-10 lg:hidden" />
                  )}
                  {active && (
                    <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-[var(--color-accent-green)] rounded-r-full shadow-[0_0_12px_rgba(163,230,53,0.6)]" />
                  )}
                  <span className={`font-mono text-sm tracking-wide ${active ? 'font-bold text-[var(--color-accent-green)]' : ''}`}>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Back to App */}
        <div className="px-6 py-6 border-t border-[var(--color-border-dark)] relative z-10 bg-[#0A0A0A]">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-mono tracking-[0.1em] text-neutral-400 hover:text-white uppercase transition-colors">
            ← Back to App
          </Link>
        </div>
      </aside>

      {/* Global Search Modal */}
      <DocsSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
