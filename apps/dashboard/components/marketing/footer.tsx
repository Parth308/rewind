"use client";

import { Play } from "lucide-react";
import { FadeUp } from "../ui/fade-up";
import { GithubIcon } from "../ui/github-icon";

export const Footer = () => {
  return (
    <>
      {/* 9. Final CTA */}
      <section className="relative overflow-hidden py-32 px-6 border-t border-[var(--color-border-dark)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-[var(--color-accent-green)] opacity-5 blur-[150px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <FadeUp>
            <h2 className="font-serif text-5xl sm:text-6xl text-white mb-6">Stop guessing.<br />Start seeing.</h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="text-xl text-neutral-400 mb-10">Join elite engineering teams taking control of their debugging pipeline.</p>
          </FadeUp>
          <FadeUp delay={0.2} className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/docs/installation" className="flex h-14 items-center justify-center rounded-lg bg-[var(--color-accent-green)] px-10 font-semibold text-black hover:bg-[var(--color-accent-green-hover)] transition-colors shadow-[0_0_20px_rgba(163,230,53,0.3)]">
              Deploy Rewind Free
            </a>
            <a href="https://github.com/Parth308/rewind" className="flex h-14 items-center justify-center gap-2 rounded-lg border border-[var(--color-border-dark)] bg-[var(--color-surface)] px-10 text-white hover:bg-white/10 transition-colors">
              <GithubIcon className="h-5 w-5" />
              Star on GitHub
            </a>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-dark)] py-12 px-6 text-sm text-neutral-500 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--color-surface)] border border-[var(--color-border-dark)]">
              <Play className="h-3 w-3 text-[var(--color-accent-green)]" />
            </div>
            <span>Rewind © {new Date().getFullYear()}. Open Source.</span>
          </div>
          <div className="flex gap-8">
            <a href="/docs" className="hover:text-white transition-colors">Documentation</a>
            <a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a>
            <a href="/docs/privacy" className="hover:text-white transition-colors">Privacy & Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
};
