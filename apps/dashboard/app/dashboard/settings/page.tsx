"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Shield, Key, Bell, CreditCard, Save, EyeOff } from 'lucide-react';
import { FadeUp } from '@/components/ui/fade-up';
import { ApiSettingsTab } from './ApiSettings';
import { PrivacySettingsTab } from './PrivacySettingsTab';

const tabs = [
  { id: 'general', name: 'General', icon: Settings },
  { id: 'privacy', name: 'Privacy & Masking', icon: EyeOff },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'api', name: 'API Keys', icon: Key },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'billing', name: 'Billing', icon: CreditCard },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="flex flex-col gap-10 max-w-6xl pb-10">
      <FadeUp>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">Configuration.</h1>
            <p className="text-lg text-white/[0.618]">Manage account parameters and platform preferences.</p>
          </div>
        </div>
      </FadeUp>

      <div className="flex flex-col lg:flex-row gap-10">

        {/* Settings Navigation */}
        <FadeUp delay={0.1} className="w-full lg:w-64 shrink-0 self-start lg:sticky lg:top-10">
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 relative scrollbar-hide w-full">
            {/* Nav Background Glow */}
            <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[var(--color-accent-green)] opacity-5 blur-[60px] pointer-events-none" />

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 lg:w-full flex items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3 lg:py-4 rounded-xl text-sm font-medium transition-all relative z-10 ${isActive
                      ? 'text-white'
                      : 'text-neutral-500 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="settings-active-tab"
                      className="absolute inset-0 bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-xl -z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="settings-active-indicator"
                      className="absolute left-0 top-3 bottom-3 w-1 bg-[var(--color-accent-green)] rounded-r"
                    />
                  )}
                  <tab.icon className={`h-4 w-4 lg:h-5 lg:w-5 transition-colors ${isActive ? 'text-[var(--color-accent-green)]' : 'text-neutral-600'}`} />
                  <span className="font-serif text-base lg:text-lg">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </FadeUp>

        {/* Settings Content Area */}
        <FadeUp delay={0.2} className="flex-1">
          <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-8 sm:p-10 relative overflow-hidden min-h-[500px]">
            {/* Grid & Glow */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />
            <div className="absolute top-0 right-0 -mt-24 -mr-24 w-80 h-80 bg-[var(--color-accent-green)] opacity-[0.02] blur-[100px] pointer-events-none rounded-full" />

            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10"
                >
                  <h3 className="font-serif text-3xl font-bold text-white mb-10 pb-6 border-b border-[var(--color-border-dark)]">
                    General Settings
                  </h3>

                  <div className="space-y-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase">
                        Display Name
                      </label>
                      <div className="relative w-full sm:w-[32rem]">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-accent-green)] font-mono">{">"}</span>
                        <input
                          type="text"
                          defaultValue="Admin User"
                          className="w-full bg-[#111] border border-[var(--color-border-dark)] rounded-xl pl-10 pr-4 py-4 text-white font-mono text-sm focus:border-[var(--color-accent-green)] focus:ring-1 focus:ring-[var(--color-accent-green)]/30 focus:outline-none transition-all shadow-inner"
                        />
                      </div>
                      <p className="text-xs font-mono text-neutral-600">Visible to all team members.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase">
                        Primary Email
                      </label>
                      <div className="relative w-full sm:w-[32rem] group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 font-mono">{">"}</span>
                        <input
                          type="email"
                          defaultValue="admin@rewind.dev"
                          disabled
                          className="w-full bg-white/[0.02] border border-[var(--color-border-dark)] rounded-xl pl-10 pr-24 py-4 text-neutral-500 font-mono text-sm cursor-not-allowed shadow-inner"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 items-center rounded border border-[var(--color-accent-green)]/30 bg-[var(--color-accent-green)]/10 px-2 text-[10px] font-mono text-[var(--color-accent-green)] uppercase tracking-wider">
                          Verified
                        </div>
                      </div>
                      <p className="text-xs font-mono text-neutral-600">Contact support to modify primary identity.</p>
                    </div>

                    <div className="pt-10 mt-10 border-t border-[var(--color-border-dark)]">
                      <button className="flex items-center gap-3 rounded-xl bg-[var(--color-accent-green)] px-8 py-4 text-sm font-mono font-bold text-black transition-all hover:bg-[var(--color-accent-green-hover)] shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)]">
                        <Save className="h-4 w-4" />
                        COMMIT CHANGES
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'api' && <ApiSettingsTab key="api" />}
              {activeTab === 'privacy' && <PrivacySettingsTab key="privacy" />}

              {activeTab !== 'general' && activeTab !== 'api' && activeTab !== 'privacy' && (
                <motion.div
                  key="other"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center h-64 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-[var(--color-border-dark)] flex items-center justify-center mb-6">
                    <Shield className="h-6 w-6 text-neutral-600" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white mb-2">Module Offline</h3>
                  <p className="text-neutral-500 font-mono text-xs">This configuration module is currently disabled in your environment.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
