"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

export function DocsTOC() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const pathname = usePathname();

  useEffect(() => {
    let observer: IntersectionObserver;

    // Small delay to ensure Next.js has mounted the new page's DOM elements
    const timeout = setTimeout(() => {
      const elements = Array.from(document.querySelectorAll('main h2, main h3'))
        .filter((element) => element.id);
        
      const items: TOCItem[] = elements.map((element) => ({
        id: element.id,
        title: element.textContent || '',
        level: parseInt(element.tagName.substring(1), 10),
      }));
      
      setHeadings(items);

      const scrollContainer = document.getElementById('docs-scroll-container');

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        { root: scrollContainer, rootMargin: '-10% 0px -40% 0px' }
      );

      elements.forEach((element) => observer.observe(element));
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (observer) observer.disconnect();
    };
  }, [pathname]);

  if (headings.length === 0) return null;

  return (
    <div className="hidden xl:block w-64 shrink-0 pl-8 relative">
      <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pr-4">
        <h4 className="text-xs font-mono tracking-[0.2em] text-neutral-500 uppercase font-bold mb-4">On this page</h4>
        <nav className="flex flex-col space-y-3">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={clsx(
                "text-sm font-sans transition-colors block leading-snug",
                heading.level === 3 ? "ml-4" : "",
                activeId === heading.id 
                  ? "text-[var(--color-accent-green)] font-medium" 
                  : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              {heading.title}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
