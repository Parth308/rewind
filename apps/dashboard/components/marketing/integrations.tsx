"use client";

import { useRef, useState, MouseEvent } from "react";
import { FadeUp } from "../ui/fade-up";
import { Database, FileCode2, Globe, TerminalSquare, Server, Layers } from "lucide-react";
import { motion } from "framer-motion";

const technologies = [
  { name: "React", icon: Globe },
  { name: "Vue.js", icon: TerminalSquare },
  { name: "Vanilla JS", icon: FileCode2 },
  { name: "Node.js", icon: Server },
  { name: "Next.js", icon: Layers },
  { name: "Postgres", icon: Database },
];

export const Integrations = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <section className="py-32 px-6 max-w-7xl mx-auto border-t border-[var(--color-border-dark)] overflow-hidden">
      <FadeUp>
        <div className="text-center mb-16">
          <h2 className="font-sans text-4xl sm:text-5xl text-white tracking-tight mb-6">Works with everything.</h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Zero complex configuration. Whether you use a heavy meta-framework or raw HTML, Rewind captures your sessions instantly.
          </p>
        </div>
      </FadeUp>

      <FadeUp delay={0.2}>
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className="relative grid grid-cols-2 md:grid-cols-3 gap-1 p-1 bg-[var(--color-border-dark)] rounded-2xl mx-auto max-w-4xl"
        >
          {/* Spotlight Effect Overlay */}
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(163,230,53,0.15), transparent 40%)`,
            }}
          />

          {technologies.map((tech, i) => {
            const Icon = tech.icon;
            return (
              <div 
                key={tech.name} 
                className="relative flex flex-col items-center justify-center gap-4 bg-[#0A0A0A] p-12 h-full transition-colors hover:bg-[#111] overflow-hidden group"
                style={{
                  borderTopLeftRadius: i === 0 ? '1rem' : '0',
                  borderTopRightRadius: i === 2 ? '1rem' : '0',
                  borderBottomLeftRadius: i === 3 ? '1rem' : '0',
                  borderBottomRightRadius: i === 5 ? '1rem' : '0',
                }}
              >
                {/* Individual Card Hover Glow */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)`
                  }}
                />
                
                <Icon className="w-10 h-10 text-neutral-600 group-hover:text-[var(--color-accent-green)] transition-colors duration-300" />
                <span className="font-medium text-neutral-500 group-hover:text-white transition-colors duration-300">
                  {tech.name}
                </span>
              </div>
            );
          })}
        </div>
      </FadeUp>
    </section>
  );
};
