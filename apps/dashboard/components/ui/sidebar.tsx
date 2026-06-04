"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, Settings, LayoutTemplate, User, Shield, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const navGroups = [
  {
    label: 'Monitor',
    items: [
      { name: 'Sessions', href: '/dashboard', icon: LayoutDashboard, exact: true },
      { name: 'Analytics', href: '/dashboard/analytics', icon: Activity, exact: false },
    ],
  },
  {
    label: 'Manage',
    items: [
      { name: 'Projects', href: '/dashboard/projects', icon: LayoutTemplate, exact: false },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings, exact: false },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="w-64 border-r border-[var(--color-border-dark)] bg-[#050505] flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-[var(--color-border-dark)] shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group w-full">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/20 transition-all group-hover:bg-[var(--color-accent-green)]/20">
            <Activity className="h-4 w-4 text-[var(--color-accent-green)]" />
          </div>
          <div>
            <div className="font-serif text-base font-bold text-white leading-none">Rewind</div>
            <div className="text-[10px] text-neutral-600 font-mono mt-0.5">v1.0.0 · dev</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-2 text-[10px] font-bold text-neutral-600 uppercase tracking-[0.12em]">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                      active
                        ? 'bg-white/[0.08] text-white'
                        : 'text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-200'
                    )}
                  >
                    {active && (
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[var(--color-accent-green)] rounded-r-full" />
                    )}
                    <Icon className={clsx(
                      'h-4 w-4 transition-colors',
                      active ? 'text-[var(--color-accent-green)]' : 'text-neutral-600 group-hover:text-neutral-400'
                    )} />
                    <span className="flex-1">{item.name}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 text-neutral-600" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Live indicator */}
      <div className="px-5 py-3 border-t border-[var(--color-border-dark)] border-b bg-[var(--color-accent-green)]/[0.02]">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-green)] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent-green)]" />
          </div>
          <span className="text-xs text-neutral-500">Ingestor live · port 3001</span>
        </div>
      </div>

      {/* User */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04] transition-colors cursor-pointer group">
          <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <User className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-sm font-medium text-neutral-300 truncate leading-none mb-0.5">Admin</div>
            <div className="text-[10px] text-neutral-600 truncate flex items-center gap-1">
              <Shield className="h-2.5 w-2.5" /> admin@rewind.dev
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
