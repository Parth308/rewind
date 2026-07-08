"use client";

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function AuthSplitLayout({ children, quote, author }: { children: ReactNode, quote: string, author: string }) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-[#050505] font-sans text-white overflow-hidden">

      {/* LEFT PANEL: The Cinematic Canvas */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        {/* Ambient Mesh Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,rgba(163,230,53,0.15)_0%,rgba(0,0,0,0)_60%)] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[100%] h-[100%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,rgba(0,0,0,0)_60%)] blur-[100px] pointer-events-none" />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30 pointer-events-none" />

        {/* Top Brand Area */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex items-center gap-3"
        >
          <Link href="/">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(163,230,53,0.2)]">
              <ShieldCheck className="w-5 h-5 text-[var(--color-accent-green)]" />
            </div>
            <span className="font-sans text-2xl font-bold tracking-tight">Rewind</span>
          </Link>
        </motion.div>

        {/* Central Statement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <h1 className="font-sans text-5xl xl:text-7xl font-bold tracking-tighter leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6">
            Your Data. <br />
            <span className="text-[var(--color-accent-green)] drop-shadow-[0_0_30px_rgba(163,230,53,0.3)]">Your Rules.</span>
          </h1>
          <p className="text-lg text-neutral-400 max-w-md leading-relaxed font-mono">
            Self-hosted, absolute privacy, and total control over your session recordings.
            Welcome to the new standard of product analytics.
          </p>
        </motion.div>

        {/* Bottom Testimonial / Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl">
            <p className="text-neutral-300 font-sans italic text-lg leading-relaxed mb-4">
              "{quote}"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-accent-green)]/20 border border-[var(--color-accent-green)]/30 flex items-center justify-center">
                <span className="text-[var(--color-accent-green)] text-xs font-bold font-mono">
                  {author.charAt(0)}
                </span>
              </div>
              <span className="text-sm text-neutral-500 font-mono tracking-widest uppercase">
                {author}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL: The Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-[#0A0A0A] relative z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
        {/* Subtle radial glow behind the form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[var(--color-accent-green)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">
          {children}
        </div>
      </div>

    </div>
  );
}
