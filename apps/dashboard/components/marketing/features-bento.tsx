"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Database, Shield, Terminal, ArrowRight, Code2 } from "lucide-react";
import { FadeUp } from "../ui/fade-up";

const features = [
  {
    id: "dom",
    title: "Pixel-Perfect DOM",
    icon: Activity,
    desc: "Lightweight mutation observer records every DOM change with zero thread overhead.",
  },
  {
    id: "network",
    title: "Network & Console",
    icon: Terminal,
    desc: "Full capture of XHR/Fetch requests, payloads, and logs perfectly synced.",
  },
  {
    id: "sql",
    title: "Raw SQL Access",
    icon: Database,
    desc: "Query telemetry directly from your Postgres database. No API limits.",
  },
  {
    id: "privacy",
    title: "Air-Gapped Privacy",
    icon: Shield,
    desc: "Deploy on a private subnet. Zero external network requests made.",
  }
];

export const FeaturesBento = () => {
  const [activeTab, setActiveTab] = useState("dom");

  return (
    <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
      <FadeUp>
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="font-sans text-4xl sm:text-5xl text-white tracking-tight mb-6">Engineered for absolute control.</h2>
          <p className="text-neutral-400 text-lg">We don't just hide features behind a generic grid. Here is exactly how Rewind captures and stores your telemetry.</p>
        </div>
      </FadeUp>

      <FadeUp delay={0.1}>
        <div className="flex flex-col lg:flex-row gap-6 glass border border-[var(--color-border-dark)] rounded-2xl p-6 shadow-2xl bg-black/50">

          {/* Left: Tab Navigation */}
          <div className="flex flex-col gap-2 w-full lg:w-1/3">
            {features.map((feature) => {
              const isActive = activeTab === feature.id;
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveTab(feature.id)}
                  className={`relative text-left p-5 rounded-xl transition-all duration-300 ${isActive ? "bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" : "hover:bg-white/5"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[var(--color-accent-green)] rounded-r"
                    />
                  )}
                  <div className={`flex items-center gap-3 mb-2 ${isActive ? "text-[var(--color-accent-green)]" : "text-neutral-400"}`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-sans text-xl">{feature.title}</span>
                  </div>
                  <p className={`text-sm ${isActive ? "text-neutral-300" : "text-neutral-500"}`}>
                    {feature.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: Dynamic Visualization Area */}
          <div className="w-full lg:w-2/3 bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-xl overflow-hidden relative min-h-[400px] lg:min-h-full flex items-center justify-center">

            {/* Ambient Background Glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-96 h-96 bg-[var(--color-accent-green)] opacity-5 blur-[100px] rounded-full" />
            </div>

            <AnimatePresence mode="wait">
              {/* --- DOM Visualization --- */}
              {activeTab === "dom" && (
                <motion.div
                  key="dom"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex flex-col p-8"
                >
                  <div className="flex items-center gap-2 mb-6 border-b border-[var(--color-border-dark)] pb-4 text-xs font-mono text-neutral-500">
                    <Code2 className="w-4 h-4" />
                    <span>rrweb / mutation-observer</span>
                  </div>
                  <div className="flex-1 relative flex items-center justify-center">
                    {/* Abstract Wireframe reconstructing */}
                    <div className="w-full max-w-sm border border-white/10 rounded-lg p-4 space-y-3 bg-[#111] relative overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "40%" }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", repeatType: "reverse" }}
                        className="h-4 bg-white/20 rounded"
                      />
                      <motion.div
                        initial={{ opacity: 0.2 }}
                        animate={{ opacity: 1 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", repeatType: "reverse", delay: 0.2 }}
                        className="h-20 bg-white/10 rounded w-full border border-dashed border-white/20"
                      />
                      <div className="flex gap-2">
                        <div className="h-8 bg-white/10 rounded w-1/2" />
                        <motion.div
                          initial={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                          animate={{ backgroundColor: "rgba(163,230,53,0.3)" }}
                          transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", repeatType: "reverse" }}
                          className="h-8 rounded w-1/2"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- Network Visualization --- */}
              {activeTab === "network" && (
                <motion.div
                  key="network"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex flex-col font-mono text-xs p-6"
                >
                  <div className="flex justify-between text-neutral-500 mb-4 pb-2 border-b border-[var(--color-border-dark)]">
                    <span>Name</span>
                    <span>Status</span>
                    <span>Time</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "graphql?op=GetUserData", status: 200, time: "42ms", color: "text-green-400", width: "w-1/4" },
                      { name: "main.b829c.js", status: 200, time: "120ms", color: "text-neutral-300", width: "w-3/4" },
                      { name: "api/v1/checkout", status: 500, time: "890ms", color: "text-red-400", width: "w-full" },
                      { name: "analytics.js", status: 200, time: "12ms", color: "text-neutral-300", width: "w-1/6" },
                    ].map((req, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex justify-between items-center bg-white/5 p-2 rounded"
                      >
                        <span className="truncate w-1/3">{req.name}</span>
                        <span className={req.color}>{req.status}</span>
                        <div className="w-1/3 flex items-center justify-end gap-2">
                          <span>{req.time}</span>
                          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 0.8, delay: i * 0.2 }}
                              className={`h-full ${req.width} ${req.status === 500 ? 'bg-red-500' : 'bg-blue-500'}`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* --- SQL Visualization --- */}
              {activeTab === "sql" && (
                <motion.div
                  key="sql"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex flex-col p-6"
                >
                  <div className="bg-[#050505] border border-[var(--color-border-dark)] rounded-lg h-full flex flex-col overflow-hidden">
                    <div className="bg-[#111] p-2 flex gap-2 border-b border-[var(--color-border-dark)]">
                      <div className="w-3 h-3 rounded-full bg-neutral-600" />
                      <div className="w-3 h-3 rounded-full bg-neutral-600" />
                      <div className="w-3 h-3 rounded-full bg-neutral-600" />
                    </div>
                    <div className="p-4 font-mono text-sm text-[var(--color-accent-green)]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "linear" }}
                        className="overflow-hidden whitespace-nowrap border-r-2 border-white pr-2"
                      >
                        {"> "}SELECT id, events FROM sessions;
                      </motion.div>
                    </div>
                    <div className="flex-1 bg-[#111]/50 p-4 font-mono text-xs text-neutral-400 overflow-hidden">
                      <motion.table
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.2 }}
                        className="w-full text-left"
                      >
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="pb-2">id</th>
                            <th className="pb-2">user_agent</th>
                            <th className="pb-2">event_count</th>
                          </tr>
                        </thead>
                        <tbody className="text-neutral-300">
                          <tr><td className="py-2 text-indigo-400">c8f92a</td><td className="py-2">Mozilla/5.0...</td><td className="py-2">1,402</td></tr>
                          <tr><td className="py-2 text-indigo-400">b2x199</td><td className="py-2">Chrome/120.0</td><td className="py-2">89</td></tr>
                        </tbody>
                      </motion.table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- Privacy Visualization --- */}
              {activeTab === "privacy" && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex items-center justify-center relative overflow-hidden"
                >
                  {/* Grid Background */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />

                  <div className="relative flex items-center justify-center w-64 h-64">
                    {/* Concentric protective rings */}
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-indigo-500/30 rounded-full"
                    />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-dashed border-indigo-500/40 rounded-full"
                    />
                    
                    {/* Central Shield */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#0A0A0A] border border-indigo-500/50 rounded-2xl z-10 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.25)] overflow-hidden">
                      <div className="absolute inset-0 bg-indigo-500/5" />
                      
                      {/* Abstract Node Core */}
                      <div className="w-6 h-6 border border-indigo-400/80 flex items-center justify-center rotate-45 mb-3 relative">
                        <motion.div 
                          animate={{ scale: [1, 0.5, 1], opacity: [1, 0.3, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="w-3 h-3 bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.8)]" 
                        />
                      </div>
                      
                      <span className="text-[10px] font-mono text-indigo-300 font-bold tracking-wider relative z-10">AIR-GAPPED</span>
                    </div>

                    {/* Animated packets attempting to leave (from center out) */}
                    {[0, 90, 180, 270].map((angle, i) => (
                      <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 h-[2px] w-10 bg-gradient-to-r from-red-500 to-transparent origin-left z-0"
                        style={{ rotate: angle, marginTop: '-1px' }}
                        animate={{ 
                          x: [20, 80], 
                          opacity: [0, 1, 0]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1.5, 
                          delay: i * 0.4,
                          ease: "easeOut"
                        }}
                      />
                    ))}
                    
                    {/* Blocked indicator */}
                    <motion.div 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0.8 }}
                      className="absolute top-8 right-8 text-[10px] font-mono text-red-400 font-bold px-2 py-1 bg-red-500/10 border border-red-500/20 rounded"
                    >
                      BLOCKED
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </FadeUp>
    </section>
  );
};
