"use client";

import { motion, useSpring, useMotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FadeUp } from "../ui/fade-up";

export const Hero = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 50;
    const y = (clientY / innerHeight - 0.5) * 50;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <section
      className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 pt-24 text-center"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Lens/Orb following mouse */}
      <motion.div
        style={{ x: smoothX, y: smoothY }}
        className="absolute top-1/2 left-1/2 -mt-[300px] -ml-[300px] h-[600px] w-[600px] rounded-full bg-[var(--color-accent-green)] opacity-[0.07] blur-[120px] pointer-events-none"
      />

      <FadeUp>
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs tracking-wide text-neutral-300 border border-[var(--color-border-dark)] uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-green)] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent-green)]"></span>
          </span>
          Self-Hosted Session Replay v1.0
        </div>
      </FadeUp>

      <FadeUp delay={0.1}>
        <h1 className="mx-auto max-w-4xl font-serif text-6xl sm:text-7xl lg:text-8xl font-medium tracking-tight text-white mb-6 leading-[1.05]">
          Own your data. <br />
          <span className="text-neutral-500">Replay the truth.</span>
        </h1>
      </FadeUp>

      <FadeUp delay={0.2}>
        <p className="mx-auto max-w-2xl text-lg text-neutral-400 leading-relaxed mb-10">
          The premium, self-hosted session replay tool for elite engineering teams. Zero SaaS bloat, zero PII leaving your VPC, and deployment in under 5 minutes.
        </p>
      </FadeUp>

      <FadeUp delay={0.3} className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
        <a href="/login" className="group relative flex h-14 w-full sm:w-auto items-center justify-center overflow-hidden rounded-lg bg-[var(--color-accent-green)] px-10 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
            <div className="relative h-full w-8 bg-white/20" />
          </div>
          ▶ Explore Live Demo
          <ArrowRight className="ml-2 h-4 w-4" />
        </a>
        <a href="/docs" className="flex h-14 w-full sm:w-auto items-center justify-center rounded-lg glass px-10 text-sm font-medium text-white transition-colors hover:bg-white/5 border border-white/10">
          Documentation
        </a>
      </FadeUp>
    </section>
  );
};
