"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FadeUp } from "../ui/fade-up";
import { Copy, Check, TerminalSquare } from "lucide-react";

export const DeploymentPipeline = () => {
  const [copied, setCopied] = useState(false);
  const code = `git clone https://github.com/Parth308/rewind.git\ncd rewind && cp .env.example .env\ndocker compose up -d`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-32 px-6 border-b border-[var(--color-border-dark)] bg-gradient-to-b from-black/50 to-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left: Copy */}
          <div className="w-full lg:w-1/2">
            <FadeUp>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-green)]/30 bg-[var(--color-accent-green)]/10 px-3 py-1 text-xs font-medium text-[var(--color-accent-green)] mb-6">
                <TerminalSquare className="w-4 h-4" />
                Docker Native
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="font-serif text-4xl sm:text-5xl text-white tracking-tight mb-6">Production ready in 60 seconds.</h2>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="text-neutral-400 text-lg leading-relaxed mb-8">
                Deploying traditional session replay tools requires provisioning Kafka clusters, Redis instances, and complex Kubernetes manifests. <br /><br />
                Rewind is compiled into a single, highly-optimized Go binary alongside a Postgres container. No bloat, no complex orchestration. Just Docker.
              </p>
            </FadeUp>
            <FadeUp delay={0.3}>
              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--color-accent-green)]" /> Minimum 1GB RAM
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--color-accent-green)]" /> 1 vCPU
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Right: Animated Terminal */}
          <div className="w-full lg:w-1/2 relative">
            <FadeUp delay={0.2}>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-[var(--color-accent-green)] opacity-5 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="text-left font-mono text-sm bg-[#050505] border border-[var(--color-border-dark)] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10">
                {/* Terminal Header */}
                <div className="flex h-12 items-center justify-between border-b border-[var(--color-border-dark)] bg-[#111] px-4">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  </div>
                  <div className="text-xs text-neutral-500">user@server:~</div>
                  <button 
                    onClick={handleCopy}
                    className="text-neutral-500 hover:text-white transition-colors flex items-center justify-center w-8 h-8 rounded hover:bg-white/5"
                    title="Copy commands"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Terminal Body */}
                <div className="p-6 space-y-4 text-neutral-300 min-h-[220px]">
                  {/* Line 1 */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-4"
                  >
                    <span className="text-neutral-600 select-none">~</span>
                    <span><span className="text-indigo-400">git clone</span> https://github.com/Parth308/rewind.git</span>
                  </motion.div>

                  {/* Line 2 */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.2 }}
                    className="flex gap-4"
                  >
                    <span className="text-neutral-600 select-none">~</span>
                    <span><span className="text-indigo-400">cd</span> rewind && <span className="text-indigo-400">cp</span> .env.example .env</span>
                  </motion.div>

                  {/* Line 3 */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.9 }}
                    className="flex gap-4"
                  >
                    <span className="text-neutral-600 select-none">~</span>
                    <span><span className="text-indigo-400">docker compose</span> up -d</span>
                  </motion.div>

                  {/* Loading output */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 2.6 }}
                    className="pl-6 text-neutral-500 pt-2"
                  >
                    [+] Running 2/2<br/>
                    <span className="text-green-400">✔ Container rewind-db</span><br/>
                    <span className="text-green-400">✔ Container rewind-core</span>
                  </motion.div>

                  {/* Success Output */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 3.2 }}
                    className="pl-6 text-[var(--color-accent-green)] font-semibold mt-4 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Rewind is online at localhost:8080
                  </motion.div>
                </div>
              </div>
            </FadeUp>
          </div>

        </div>
      </div>
    </section>
  );
};
