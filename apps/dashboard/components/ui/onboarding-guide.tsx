"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, Copy, Check, LayoutTemplate, Code2, Rocket, ExternalLink, ArrowRight, Play } from 'lucide-react';
import { FadeUp } from '@/components/ui/fade-up';

interface OnboardingGuideProps {
  hasProject: boolean;
  projectToken: string | null;
}

function CodeBlock({ code, language = 'html' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code mt-6 rounded-xl overflow-hidden border border-[var(--color-border-dark)] bg-[#050505] shadow-2xl">
      <div className="flex items-center justify-between px-5 py-3 bg-[#111] border-b border-[var(--color-border-dark)] relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-700 group-hover/code:bg-red-500/80 transition-colors" />
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-700 group-hover/code:bg-amber-500/80 transition-colors" />
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-700 group-hover/code:bg-green-500/80 transition-colors" />
          <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-[0.2em] ml-3">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-neutral-500 hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-[var(--color-accent-green)]" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-50" />
        <pre className="p-6 font-mono text-sm text-neutral-300 overflow-x-auto leading-relaxed whitespace-pre-wrap relative z-10">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
}

export function OnboardingGuide({ hasProject, projectToken }: OnboardingGuideProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(hasProject ? 1 : 0);
  const [activeTab, setActiveTab] = useState<'html' | 'react' | 'next' | 'vue' | 'svelte'>('html');

  const ingestUrl = process.env.NEXT_PUBLIC_INGEST_URL || 'http://localhost:3001';

  const steps: Step[] = [
    {
      id: 0,
      title: 'Initialize Node',
      description: 'Create a project to generate an ingestion token.',
      icon: LayoutTemplate,
      completed: hasProject,
    },
    {
      id: 1,
      title: 'Inject Script',
      description: 'Embed the tracking script into your client application.',
      icon: Code2,
      completed: false,
    },
    {
      id: 2,
      title: 'Monitor Telemetry',
      description: 'Observe incoming session data in real-time.',
      icon: Rocket,
      completed: false,
    },
  ];

  const trackerSnippet = `<!-- Step 1: Configure endpoint BEFORE the tracker loads -->
<script>
  window.__rewind = {
    token: '${projectToken ?? 'YOUR_PROJECT_TOKEN'}',
    endpoint: '${ingestUrl}/ingest',
  };
</script>

<!-- Step 2: Inject the tracker script (auto-initializes) -->
<script src="${ingestUrl}/tracker/tracker.js"></script>`;

  const reactSnippet = `// Main entry point (e.g. main.tsx or App.tsx)
import { useEffect } from 'react';

export function App() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.__rewind) {
      window.__rewind = {
        token: '${projectToken ?? 'YOUR_PROJECT_TOKEN'}',
        endpoint: 'http://localhost:3001/ingest',
      };
      
      const script = document.createElement('script');
      script.src = 'http://localhost:3001/tracker/tracker.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return <div>Your Application</div>;
}`;

  const nextJsSnippet = `// Root Layout (app/layout.tsx)
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script id="rewind-config" strategy="beforeInteractive">
          {\`window.__rewind = {
            token: '${projectToken ?? 'YOUR_PROJECT_TOKEN'}',
            endpoint: 'http://localhost:3001/ingest',
          };\`}
        </Script>
        <Script 
          src="http://localhost:3001/tracker/tracker.js" 
          strategy="afterInteractive" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`;

  const vueSnippet = `// Main entry point (main.ts)
import { createApp } from 'vue'
import App from './App.vue'

if (typeof window !== 'undefined' && !window.__rewind) {
  window.__rewind = {
    token: '${projectToken ?? 'YOUR_PROJECT_TOKEN'}',
    endpoint: '${ingestUrl}/ingest',
  };
  
  const script = document.createElement('script');
  script.src = '${ingestUrl}/tracker/tracker.js';
  script.async = true;
  document.head.appendChild(script);
}

createApp(App).mount('#app')`;

  const svelteSnippet = `<!-- Root layout (src/app.html) -->
<head>
  <script>
    window.__rewind = {
      token: '${projectToken ?? 'YOUR_PROJECT_TOKEN'}',
      endpoint: '${ingestUrl}/ingest',
    };
  </script>
  <script src="${ingestUrl}/tracker/tracker.js" async></script>
  %svelte.head%
</head>`;

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto pb-10">
      {/* Hero Header */}
      <FadeUp>
        <div className="relative bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-10 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          <div className="absolute top-0 right-0 -mt-32 -mr-32 w-[32rem] h-[32rem] bg-[var(--color-accent-green)] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="relative flex h-3 w-3">
                <span className="animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-green)] opacity-60" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-accent-green)] shadow-[0_0_12px_var(--color-accent-green)]" />
              </div>
              <span className="text-xs font-mono text-[var(--color-accent-green)] uppercase tracking-[0.2em] font-bold">System Initialization</span>
            </div>
            <h1 className="font-serif text-5xl font-bold tracking-tight text-white mb-6">
              Welcome to Rewind.
            </h1>
            <p className="text-neutral-400 text-lg leading-relaxed font-mono">
              You're steps away from capturing full-stack telemetry. Follow the initialization protocol below to configure your first tracking node.
            </p>
          </div>
        </div>
      </FadeUp>

      {/* Step Progress Bar */}
      <FadeUp delay={0.1}>
        <div className="bg-[#050505] border border-[var(--color-border-dark)] rounded-2xl p-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-full h-px bg-[var(--color-border-dark)] -z-10" />

          <div className="flex items-center gap-0">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none relative bg-[#050505]">
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-4 rounded-xl px-6 py-4 transition-all w-full relative group ${activeStep === step.id ? '' : 'hover:bg-white/[0.02]'
                    }`}
                >
                  {activeStep === step.id && (
                    <motion.div
                      layoutId="onboarding-active-tab"
                      className="absolute inset-0 bg-[#111] border border-[var(--color-border-dark)] rounded-xl -z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    />
                  )}
                  {activeStep === step.id && (
                    <motion.div
                      layoutId="onboarding-active-indicator"
                      className="absolute left-0 top-3 bottom-3 w-1 bg-[var(--color-accent-green)] rounded-r-full shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                    />
                  )}

                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${step.completed
                      ? 'border-[var(--color-accent-green)] bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)] shadow-[0_0_15px_rgba(163,230,53,0.2)]'
                      : activeStep === step.id
                        ? 'border-white/20 bg-white/5 text-white'
                        : 'border-[var(--color-border-dark)] bg-transparent text-neutral-600'
                    }`}>
                    {step.completed
                      ? <CheckCircle2 className="h-5 w-5" />
                      : <span className="font-mono text-sm font-bold">{step.id + 1}</span>
                    }
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className={`text-[10px] font-mono uppercase tracking-[0.2em] mb-1 ${activeStep === step.id ? 'text-[var(--color-accent-green)]' : 'text-neutral-600'}`}>
                      Phase {step.id + 1}
                    </div>
                    <div className={`font-serif text-lg ${activeStep === step.id ? 'text-white' : step.completed ? 'text-[var(--color-accent-green)]' : 'text-neutral-500'}`}>
                      {step.title}
                    </div>
                  </div>
                </button>
                {i < steps.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-neutral-800 shrink-0 mx-2 bg-[#050505]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* Step Content */}
      <FadeUp delay={0.2}>
        <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl p-10 shadow-2xl relative overflow-hidden min-h-[500px]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

          <AnimatePresence mode="wait">
            {/* Step 0: Create a Project */}
            {activeStep === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-10 relative z-10"
              >
                <div className="flex items-center gap-6 border-b border-[var(--color-border-dark)] pb-8">
                  <div className="h-16 w-16 rounded-2xl bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/30 flex items-center justify-center text-[var(--color-accent-green)] shadow-[0_0_30px_rgba(163,230,53,0.15)]">
                    <LayoutTemplate className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-white">Initialize Node</h2>
                    <p className="text-neutral-400 font-mono text-sm mt-2">Generate a unique ingestion token for your application.</p>
                  </div>
                </div>

                <div className="border border-[var(--color-border-dark)] rounded-xl overflow-hidden bg-[#111]">
                  <div className="bg-black/50 px-6 py-4 border-b border-[var(--color-border-dark)] flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    <h3 className="font-mono text-xs uppercase tracking-widest text-white">What is a Project?</h3>
                  </div>
                  <div className="p-6 space-y-4 font-mono text-sm text-neutral-400 leading-relaxed">
                    <p>Every application requires a unique <span className="text-white border-b border-white/20 pb-0.5">Project Token</span>. This token authenticates incoming telemetry to the Rewind Ingestor.</p>
                    <p>You can provision multiple projects — for example, isolating production data from staging environments.</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-6">
                  <Link
                    href="/dashboard/projects"
                    className="flex items-center gap-3 rounded-xl bg-[var(--color-accent-green)] px-8 py-4 font-mono text-sm font-bold text-black transition-all hover:bg-[var(--color-accent-green-hover)] shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)]"
                  >
                    ACCESS PROJECTS
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {hasProject && (
                    <button
                      onClick={() => setActiveStep(1)}
                      className="flex items-center gap-3 rounded-xl border border-[var(--color-border-dark)] bg-transparent px-8 py-4 font-mono text-sm font-medium text-neutral-300 transition-all hover:bg-white/5 hover:border-white/20"
                    >
                      TOKEN ACQUIRED
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 1: Install Tracker */}
            {activeStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-10 relative z-10"
              >
                <div className="flex items-center gap-6 border-b border-[var(--color-border-dark)] pb-8">
                  <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                    <Code2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-white">Inject Script</h2>
                    <p className="text-neutral-400 font-mono text-sm mt-2">Embed the tracking client into your application architecture.</p>
                  </div>
                </div>

                {!hasProject && (
                  <div className="flex items-start gap-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-6 shadow-inner">
                    <div className="h-6 w-6 shrink-0 text-amber-500 mt-0.5 flex items-center justify-center border border-amber-500/50 rounded-full bg-amber-500/10 font-bold font-mono text-xs">!</div>
                    <div>
                      <p className="text-base font-serif font-bold text-amber-400">Missing Project Token</p>
                      <p className="text-sm font-mono text-amber-500/70 mt-2">
                        <button onClick={() => setActiveStep(0)} className="underline hover:text-amber-400 transition-colors">Return to Phase 1</button> and provision a project to generate your token.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 border-b border-[var(--color-border-dark)] mb-6 overflow-x-auto scrollbar-hide">
                    <button 
                      onClick={() => setActiveTab('html')} 
                      className={`px-4 py-3 font-mono text-sm border-b-2 transition-colors relative top-px whitespace-nowrap ${activeTab === 'html' ? 'border-[var(--color-accent-green)] text-[var(--color-accent-green)] font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                    >
                      HTML / Vanilla
                    </button>
                    <button 
                      onClick={() => setActiveTab('react')} 
                      className={`px-4 py-3 font-mono text-sm border-b-2 transition-colors relative top-px whitespace-nowrap ${activeTab === 'react' ? 'border-[var(--color-accent-green)] text-[var(--color-accent-green)] font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                    >
                      React / Vite
                    </button>
                    <button 
                      onClick={() => setActiveTab('next')} 
                      className={`px-4 py-3 font-mono text-sm border-b-2 transition-colors relative top-px whitespace-nowrap ${activeTab === 'next' ? 'border-[var(--color-accent-green)] text-[var(--color-accent-green)] font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                    >
                      Next.js
                    </button>
                    <button 
                      onClick={() => setActiveTab('vue')} 
                      className={`px-4 py-3 font-mono text-sm border-b-2 transition-colors relative top-px whitespace-nowrap ${activeTab === 'vue' ? 'border-[var(--color-accent-green)] text-[var(--color-accent-green)] font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                    >
                      Vue.js
                    </button>
                    <button 
                      onClick={() => setActiveTab('svelte')} 
                      className={`px-4 py-3 font-mono text-sm border-b-2 transition-colors relative top-px whitespace-nowrap ${activeTab === 'svelte' ? 'border-[var(--color-accent-green)] text-[var(--color-accent-green)] font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                    >
                      SvelteKit
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTab === 'html' && (
                      <motion.div key="html" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <h3 className="text-lg font-serif text-white mb-2 flex items-center gap-3">
                          Standard HTML Injection
                        </h3>
                        <p className="text-sm font-mono text-neutral-500 mb-4">Embed within the <code className="text-neutral-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">&lt;head&gt;</code> of your index document.</p>
                        <CodeBlock code={trackerSnippet} language="html" />
                      </motion.div>
                    )}
                    {activeTab === 'react' && (
                      <motion.div key="react" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <h3 className="text-lg font-serif text-white mb-2 flex items-center gap-3">
                          React Integration
                        </h3>
                        <p className="text-sm font-mono text-neutral-500 mb-4">Initialize at application root component.</p>
                        <CodeBlock code={reactSnippet} language="tsx" />
                      </motion.div>
                    )}
                    {activeTab === 'next' && (
                      <motion.div key="next" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <h3 className="text-lg font-serif text-white mb-2 flex items-center gap-3">
                          Next.js (App Router) Integration
                        </h3>
                        <p className="text-sm font-mono text-neutral-500 mb-4">Utilize <code className="text-neutral-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">next/script</code> in your root layout.</p>
                        <CodeBlock code={nextJsSnippet} language="tsx" />
                      </motion.div>
                    )}
                    {activeTab === 'vue' && (
                      <motion.div key="vue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <h3 className="text-lg font-serif text-white mb-2 flex items-center gap-3">
                          Vue 3 / Vite Integration
                        </h3>
                        <p className="text-sm font-mono text-neutral-500 mb-4">Inject the script dynamically in your <code className="text-neutral-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">main.ts</code> before mounting the app.</p>
                        <CodeBlock code={vueSnippet} language="typescript" />
                      </motion.div>
                    )}
                    {activeTab === 'svelte' && (
                      <motion.div key="svelte" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <h3 className="text-lg font-serif text-white mb-2 flex items-center gap-3">
                          SvelteKit Integration
                        </h3>
                        <p className="text-sm font-mono text-neutral-500 mb-4">Add the script tag directly into your <code className="text-neutral-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">src/app.html</code> document head.</p>
                        <CodeBlock code={svelteSnippet} language="html" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-black border border-[var(--color-accent-green)]/30 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-accent-green)]" />
                  <p className="text-sm text-[var(--color-accent-green)]/80 font-mono leading-relaxed">
                    {'>'} The tracker initializes <strong>automatically</strong> upon load.<br />
                    {'>'} Ensure <code>window.__rewind.token</code> is assigned prior to script execution.
                  </p>
                </div>

                <div className="flex items-center gap-6 pt-6 border-t border-[var(--color-border-dark)]">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="flex items-center gap-3 rounded-xl bg-[var(--color-accent-green)] px-8 py-4 font-mono text-sm font-bold text-black transition-all hover:bg-[var(--color-accent-green-hover)] shadow-[0_0_20px_rgba(163,230,53,0.3)]"
                  >
                    INJECTION COMPLETE
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveStep(0)}
                    className="font-mono text-sm text-neutral-500 hover:text-white transition-colors"
                  >
                    ← REVERT PHASE
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Waiting for sessions */}
            {activeStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-10 relative z-10"
              >
                <div className="flex items-center gap-6 border-b border-[var(--color-border-dark)] pb-8">
                  <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                    <Rocket className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-white">Monitor Telemetry</h2>
                    <p className="text-neutral-400 font-mono text-sm mt-2">Awaiting inbound data streams from client applications.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: 'DOM Events', desc: 'Mutation observers track structural changes invisibly.', color: 'text-[var(--color-accent-green)]', bg: 'bg-[#111]', border: 'border-[var(--color-border-dark)]', glow: 'shadow-[inset_0_1px_0_rgba(163,230,53,0.2)]' },
                    { label: 'Network Activity', desc: 'XHR & Fetch payloads logged with microsecond precision.', color: 'text-blue-400', bg: 'bg-[#111]', border: 'border-[var(--color-border-dark)]', glow: 'shadow-[inset_0_1px_0_rgba(59,130,246,0.2)]' },
                    { label: 'Console Stream', desc: 'Runtime exceptions and warnings captured chronologically.', color: 'text-purple-400', bg: 'bg-[#111]', border: 'border-[var(--color-border-dark)]', glow: 'shadow-[inset_0_1px_0_rgba(168,85,247,0.2)]' },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-xl p-6 border ${item.bg} ${item.border} ${item.glow} relative overflow-hidden group`}>
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.02] transition-colors" />
                      <div className={`font-mono text-sm uppercase tracking-widest font-bold mb-3 ${item.color}`}>{item.label}</div>
                      <p className="font-mono text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="border border-[var(--color-border-dark)] rounded-xl p-8 bg-black/50 mt-6">
                  <h3 className="font-mono text-sm text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                    <div className="w-2 h-2 bg-[var(--color-accent-green)] rounded-full animate-pulse" />
                    Verification Protocol
                  </h3>
                  <div className="space-y-4 font-mono text-sm text-neutral-400">
                    <div className="flex gap-4 items-start">
                      <span className="text-[var(--color-accent-green)] font-bold shrink-0 mt-0.5">01</span>
                      <p>Access your instrumented application environment.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                      <span className="text-[var(--color-accent-green)] font-bold shrink-0 mt-0.5">02</span>
                      <p>Perform standard user interactions (clicks, navigation).</p>
                    </div>
                    <div className="flex gap-4 items-start">
                      <span className="text-[var(--color-accent-green)] font-bold shrink-0 mt-0.5">03</span>
                      <p>Return to this console and click SCAN FOR SESSIONS.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-6 border-t border-[var(--color-border-dark)] mt-6">
                  <button
                    onClick={() => {
                      router.refresh();
                    }}
                    className="flex items-center gap-3 rounded-xl bg-[var(--color-accent-green)] px-8 py-4 font-mono text-sm font-bold text-black transition-all hover:bg-[var(--color-accent-green-hover)] shadow-[0_0_20px_rgba(163,230,53,0.3)]"
                  >
                    <Play className="h-4 w-4" />
                    SCAN FOR SESSIONS
                  </button>
                  <button
                    onClick={() => setActiveStep(1)}
                    className="font-mono text-sm text-neutral-500 hover:text-white transition-colors"
                  >
                    ← REVERT PHASE
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </FadeUp>

      {/* Quick links footer */}
      <FadeUp delay={0.3}>
        <div className="border border-[var(--color-border-dark)] rounded-2xl p-8 bg-[#050505]">
          <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em] mb-6 font-bold flex items-center gap-3">
            <div className="w-8 h-px bg-[var(--color-border-dark)]" />
            System Resources
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Architecture Specs', href: '/dashboard/settings', desc: 'Service topology & configuration.' },
              { label: 'Node Management', href: '/dashboard/projects', desc: 'Provision and revoke tokens.' },
              { label: 'Global Analytics', href: '/dashboard/analytics', desc: 'System-wide telemetry analysis.' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-start gap-4 rounded-xl border border-[var(--color-border-dark)] bg-[#0A0A0A] p-5 hover:bg-[#111] hover:border-white/20 transition-all group"
              >
                <div className="flex-1">
                  <div className="font-serif text-lg font-bold text-white mb-2 group-hover:text-[var(--color-accent-green)] transition-colors">{link.label}</div>
                  <div className="font-mono text-xs text-neutral-500 leading-relaxed">{link.desc}</div>
                </div>
                <ExternalLink className="h-4 w-4 text-neutral-600 group-hover:text-[var(--color-accent-green)] transition-colors shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
