"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import React from 'react';

export function DocsBreadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);
  
  // Create breadcrumb items
  const items = paths.map((path, index) => {
    const href = `/${paths.slice(0, index + 1).join('/')}`;
    // Format name (e.g., ai-setup -> AI Setup)
    const name = path
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    // Replace 'Docs' with 'Documentation' for display
    const displayName = name === 'Docs' ? 'Documentation' : name;
      
    return { href, name: displayName, isLast: index === paths.length - 1 };
  });

  return (
    <nav className="flex items-center space-x-2 text-sm font-mono text-neutral-500 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
      <Link href="/" className="hover:text-[var(--color-accent-green)] transition-colors flex items-center">
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={item.href}>
          <ChevronRight className="w-4 h-4 text-neutral-700 shrink-0" />
          {item.isLast ? (
            <span className="text-[var(--color-accent-green)] font-medium tracking-wide">
              {item.name}
            </span>
          ) : (
            <Link href={item.href} className="hover:text-neutral-300 transition-colors tracking-wide">
              {item.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
