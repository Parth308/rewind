"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const nav = [
  { name: 'Sessions', href: '/dashboard', exact: true },
  { name: 'Analytics', href: '/dashboard/analytics', exact: false },
  { name: 'Projects', href: '/dashboard/projects', exact: false },
  { name: 'System', href: '/dashboard/system', exact: false },
  { name: 'Settings', href: '/dashboard/settings', exact: false },
];

export function Sidebar({ isLive = true }: { isLive?: boolean }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile Header — in flow, pushes content down */}
      <div className="md:hidden fixed top-0 left-0 right-0 flex items-center justify-between px-4 h-14 border-b border-[var(--color-border-dark)] bg-[#0A0A0A]/95 backdrop-blur-md z-30 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[#0a0a0a] font-black text-sm font-mono shadow-[0_0_15px_rgba(163,230,53,0.3)]"
            style={{ background: '#a3e635' }}
          >
            R
          </div>
          <span className="font-serif text-xl font-bold text-white tracking-tight">Rewind</span>
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
            className="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={clsx(
        "w-64 border-r border-[var(--color-border-dark)] bg-[#050505] flex flex-col shrink-0 overflow-hidden z-50 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        // Desktop: in flow with positioning context, full height
        "md:relative md:translate-x-0 md:h-screen",
        // Mobile: fixed drawer, out of flow
        "fixed inset-y-0 left-0 h-full",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />

        {/* Desktop Logo */}
        <div className="hidden md:flex h-20 items-center px-6 border-b border-[var(--color-border-dark)] shrink-0 relative z-10 bg-[#050505]/80 backdrop-blur-md">
          <Link href="/dashboard" className="flex items-center gap-4 group relative">
            <div className="absolute inset-0 bg-[var(--color-accent-green)] blur-[25px] opacity-10 group-hover:opacity-40 transition-opacity" />
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-[#0a0a0a] font-black text-lg font-mono shadow-[0_0_20px_rgba(163,230,53,0.3)] relative z-10"
              style={{ background: '#a3e635' }}
            >
              R
            </div>
            <span className="font-serif text-2xl font-bold text-white tracking-tight relative z-10">Rewind</span>
          </Link>
        </div>

        {/* Mobile drawer header */}
        <div className="md:hidden flex h-14 items-center px-6 border-b border-[var(--color-border-dark)] shrink-0 relative z-10 bg-[#0A0A0A]">
          <span className="text-xs font-mono tracking-[0.2em] text-neutral-500 uppercase font-bold">Navigation</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 relative z-10">
          <div className="hidden md:block text-xs font-mono tracking-[0.2em] text-neutral-600 mb-6 px-3 uppercase font-bold">System Menu</div>
          <div className="space-y-2 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-40 bg-[var(--color-accent-green)] opacity-[0.03] blur-[50px] pointer-events-none" />
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
                      className="absolute inset-0 bg-white/[0.08] border border-white/[0.1] rounded-xl -z-10 hidden md:block"
                    />
                  )}
                  {active && (
                    <div className="absolute inset-0 bg-white/[0.08] border border-white/[0.1] rounded-xl -z-10 md:hidden" />
                  )}
                  {active && (
                    <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-[var(--color-accent-green)] rounded-r-full shadow-[0_0_12px_rgba(163,230,53,0.6)]" />
                  )}
                  <span className={`font-mono text-sm tracking-wide ${active ? 'font-bold' : ''}`}>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Status */}
        <div className="px-6 py-6 border-t border-[var(--color-border-dark)] relative z-10 bg-[#0A0A0A]">
          <div className="flex items-center gap-4">
            <div className="relative flex h-3 w-3">
              {isLive ? (
                <>
                  <span className="animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-green)] opacity-70" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-accent-green)] shadow-[0_0_12px_var(--color-accent-green)]" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]" />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-mono tracking-[0.2em] text-neutral-400 uppercase leading-none mb-1">
                {isLive ? 'Signal Lock' : 'Offline'}
              </span>
              <span className="text-[13px] font-mono text-neutral-500 leading-none">
                {isLive ? 'PORT:3001' : 'NO CONNECTION'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}