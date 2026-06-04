"use client";

import { Code, LayoutDashboard, Server } from "lucide-react";
import { FadeUp } from "../ui/fade-up";

export const ArchitectureFlow = () => {
  return (
    <section id="architecture" className="py-24 px-6 border-y border-[var(--color-border-dark)] bg-black/30">
      <div className="max-w-5xl mx-auto">
        <FadeUp>
          <div className="mb-16 text-center">
            <h2 className="font-serif text-4xl text-white tracking-tight mb-4">Dead-Simple Architecture</h2>
            <p className="text-neutral-400">No Kafka. No Kubernetes. Just a single Go binary and Postgres.</p>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="relative p-8 glass border border-[var(--color-border-dark)] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Flow lines (absolute) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-accent-green)]/30 to-transparent -z-10" />

            <div className="bg-[#111] border border-white/10 rounded-xl p-6 w-full md:w-1/3 text-center z-10 shadow-xl">
              <Code className="w-8 h-8 text-neutral-300 mx-auto mb-4" />
              <div className="font-serif text-lg text-white mb-2">Client SDK</div>
              <div className="text-xs text-neutral-500 font-mono">npm i @rewind/browser</div>
            </div>

            <div className="bg-[#111] border border-[var(--color-accent-green)]/30 rounded-xl p-6 w-full md:w-1/3 text-center z-10 shadow-[0_0_30px_rgba(163,230,53,0.1)] relative">
              <div className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-green)]">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-green)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-black"></span>
              </div>
              <Server className="w-8 h-8 text-[var(--color-accent-green)] mx-auto mb-4" />
              <div className="font-serif text-lg text-[var(--color-accent-green)] mb-2">Rewind Core</div>
              <div className="text-xs text-neutral-500 font-mono">Go + Postgres + Redis</div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-xl p-6 w-full md:w-1/3 text-center z-10 shadow-xl">
              <LayoutDashboard className="w-8 h-8 text-neutral-300 mx-auto mb-4" />
              <div className="font-serif text-lg text-white mb-2">Dashboard</div>
              <div className="text-xs text-neutral-500 font-mono">Next.js Web UI</div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
};
