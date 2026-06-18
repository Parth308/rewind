"use client";

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { CodeBlock } from './code-block';

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export function PackageManagerTabs({ packageName }: { packageName: string }) {
  const [activeTab, setActiveTab] = useState<PackageManager>('pnpm');

  const tabs: { id: PackageManager; label: string; command: string }[] = [
    { id: 'npm', label: 'npm', command: `npm install ${packageName}` },
    { id: 'pnpm', label: 'pnpm', command: `pnpm add ${packageName}` },
    { id: 'yarn', label: 'yarn', command: `yarn add ${packageName}` },
    { id: 'bun', label: 'bun', command: `bun add ${packageName}` },
  ];

  return (
    <div className="my-6 border border-[var(--color-border-dark)] rounded-xl overflow-hidden bg-[#050505]">
      <div className="flex items-center gap-2 px-2 py-2 border-b border-[var(--color-border-dark)] bg-black/40 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-4 py-1.5 rounded-lg text-sm font-mono transition-colors whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-white/[0.08] text-[var(--color-accent-green)] font-semibold border border-white/10" 
                : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] border border-transparent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4 bg-[#0a0a0a]">
        {tabs.map((tab) => (
          <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
            <CodeBlock language="bash" code={tab.command} />
          </div>
        ))}
      </div>
    </div>
  );
}
