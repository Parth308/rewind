"use client";

import { motion } from "framer-motion";
import { Play, MousePointer2 } from "lucide-react";
import { FadeUp } from "../ui/fade-up";

export const ReplayDemo = () => {
  return (
    <section id="demo" className="py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <div className="mb-12 text-center">
            <h2 className="font-sans text-4xl sm:text-5xl text-white tracking-tight mb-4">The Replay Interface</h2>
            <p className="text-neutral-400">Everything you need to debug, cleanly organized.</p>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="rounded-xl border border-[var(--color-border-dark)] bg-[#0A0A0A] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]">
            {/* Mock Video Area */}
            <div className="flex-1 bg-black relative border-r border-[var(--color-border-dark)] p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                <div className="ml-4 font-mono text-xs text-neutral-600 bg-white/5 px-2 py-1 rounded">https://app.acme.com/dashboard</div>
              </div>
              <div className="flex-1 bg-[#111] rounded-lg border border-white/5 relative overflow-hidden flex items-center justify-center">
                {/* Mock UI in video */}
                <div className="w-3/4 h-3/4 border border-white/10 rounded-lg p-6 relative">
                  <div className="w-32 h-4 bg-white/10 rounded mb-8" />
                  <div className="space-y-4">
                    <div className="w-full h-12 bg-white/5 rounded flex items-center px-4">
                      <div className="w-20 h-3 bg-white/10 rounded" />
                    </div>
                    <div className="w-full h-12 bg-white/5 rounded flex items-center px-4 border border-red-500/30">
                      <div className="w-20 h-3 bg-red-500/50 rounded" />
                    </div>
                  </div>
                  
                  {/* Animated Mouse Cursor */}
                  <motion.div 
                    animate={{ x: [0, 150, 150, 50], y: [0, 80, 80, 150] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute top-10 left-10"
                  >
                    <MousePointer2 className="w-6 h-6 text-white drop-shadow-md" />
                  </motion.div>
                </div>
              </div>
              {/* Mock Timeline */}
              <div className="h-12 mt-4 flex items-center gap-4 px-2">
                <Play className="w-4 h-4 text-white" />
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden relative">
                  <motion.div 
                    animate={{ width: ["0%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute top-0 left-0 h-full bg-[var(--color-accent-green)]" 
                  />
                </div>
                <div className="font-mono text-xs text-neutral-500">00:04 / 01:23</div>
              </div>
            </div>

            {/* Event Log */}
            <div className="w-full md:w-80 bg-[#0F0F0F] flex flex-col font-mono text-xs">
              <div className="p-4 border-b border-[var(--color-border-dark)] flex gap-4 text-neutral-400">
                <span className="text-white">Console</span>
                <span>Network</span>
                <span>Events</span>
              </div>
              <div className="flex-1 overflow-hidden relative p-4 space-y-3">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F0F0F] z-10 pointer-events-none" />
                
                {/* Animated Events sliding up */}
                <motion.div
                  animate={{ y: [0, -120] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="space-y-4"
                >
                  <div className="text-neutral-500 flex gap-3"><span className="text-blue-400">INFO</span><span>App initialized</span></div>
                  <div className="text-neutral-500 flex gap-3"><span className="text-blue-400">INFO</span><span>User authenticated (id: 839)</span></div>
                  <div className="text-neutral-500 flex gap-3"><span className="text-green-400">GET</span><span>/api/v1/workspaces - 200 OK</span></div>
                  <div className="text-neutral-500 flex gap-3"><span className="text-purple-400">CLICK</span><span>button#submit-payment</span></div>
                  <div className="text-neutral-500 flex gap-3"><span className="text-red-400">ERROR</span><span className="text-red-300">Uncaught TypeError: undefined is not a function</span></div>
                  <div className="text-neutral-500 flex gap-3"><span className="text-green-400">POST</span><span>/api/v1/telemetry - 200 OK</span></div>
                </motion.div>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
};
