"use client";

import { Check, X } from "lucide-react";
import { FadeUp } from "../ui/fade-up";

export const AsymmetricMatrix = () => {
  return (
    <section className="py-32 px-6 max-w-6xl mx-auto">
      <FadeUp>
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h2 className="font-sans text-4xl sm:text-5xl text-white tracking-tight mb-4">The Asymmetric Matrix</h2>
          <p className="text-neutral-400">Why elite teams are ripping out expensive SaaS tools for Rewind.</p>
        </div>
      </FadeUp>

      <div className="grid md:grid-cols-2 gap-0 border border-[var(--color-border-dark)] rounded-2xl overflow-hidden glass shadow-2xl">
        {/* SaaS Bloat Side */}
        <div className="p-10 border-b md:border-b-0 md:border-r border-[var(--color-border-dark)] bg-black/40">
          <h3 className="font-sans text-2xl text-neutral-500 mb-8 pb-4 border-b border-[var(--color-border-dark)]">Legacy SaaS Bloat</h3>
          <ul className="space-y-6">
            <li className="flex items-start gap-4">
              <X className="w-5 h-5 text-red-500/70 mt-0.5 shrink-0" />
              <div>
                <div className="text-neutral-300 font-medium">Vendor Lock-in</div>
                <div className="text-sm text-neutral-600 mt-1">Your session data is trapped in their database, inaccessible via raw SQL.</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <X className="w-5 h-5 text-red-500/70 mt-0.5 shrink-0" />
              <div>
                <div className="text-neutral-300 font-medium">Compliance Nightmares</div>
                <div className="text-sm text-neutral-600 mt-1">Constant DPA signing and PII masking configuration required to stay legal.</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <X className="w-5 h-5 text-red-500/70 mt-0.5 shrink-0" />
              <div>
                <div className="text-neutral-300 font-medium">Extortionate Pricing</div>
                <div className="text-sm text-neutral-600 mt-1">$100+/mo base fees plus volume-based overages that punish you for growing.</div>
              </div>
            </li>
          </ul>
        </div>

        {/* Rewind Side */}
        <div className="p-10 bg-gradient-to-b from-[var(--color-surface)] to-transparent relative group">
          <div className="absolute inset-0 bg-[var(--color-accent-green)] opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500" />
          <h3 className="font-sans text-2xl text-white mb-8 pb-4 border-b border-[var(--color-border-dark)] flex justify-between items-center">
            Rewind
            <span className="text-[10px] font-mono tracking-widest text-[var(--color-accent-green)] border border-[var(--color-accent-green)]/30 bg-[var(--color-accent-green)]/10 px-2 py-1 rounded">THE NEW STANDARD</span>
          </h3>
          <ul className="space-y-6 relative z-10">
            <li className="flex items-start gap-4">
              <Check className="w-5 h-5 text-[var(--color-accent-green)] mt-0.5 shrink-0" />
              <div>
                <div className="text-white font-medium">100% Data Ownership</div>
                <div className="text-sm text-neutral-400 mt-1">Data lives in your Postgres instance. Query it, export it, do whatever you want.</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <Check className="w-5 h-5 text-[var(--color-accent-green)] mt-0.5 shrink-0" />
              <div>
                <div className="text-white font-medium">Instant Compliance</div>
                <div className="text-sm text-neutral-400 mt-1">Since data never leaves your VPC, you are inherently GDPR and SOC2 compliant.</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <Check className="w-5 h-5 text-[var(--color-accent-green)] mt-0.5 shrink-0" />
              <div>
                <div className="text-white font-medium">Flat Infrastructure Cost</div>
                <div className="text-sm text-neutral-400 mt-1">Runs perfectly on a $6/mo VPS. No seat limits. No volume overages.</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
