"use client";

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Circle, ChevronRight, Copy, Check, LayoutTemplate, Code2, Rocket, ExternalLink, ArrowRight, Play } from 'lucide-react';

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
    <div className="relative group/code mt-4 rounded-xl overflow-hidden border border-[var(--color-border-dark)] bg-[#050505]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-[var(--color-accent-green)]" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
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
  const [activeStep, setActiveStep] = useState(hasProject ? 1 : 0);

  const steps: Step[] = [
    {
      id: 0,
      title: 'Create a Project',
      description: 'A project holds your tracking token and groups all recorded sessions together.',
      icon: LayoutTemplate,
      completed: hasProject,
    },
    {
      id: 1,
      title: 'Install the Tracker',
      description: 'Paste a single script tag into your website\'s HTML to start capturing sessions.',
      icon: Code2,
      completed: false,
    },
    {
      id: 2,
      title: 'Watch Sessions Come In',
      description: 'Once a user visits your site, their session will appear here in real time.',
      icon: Rocket,
      completed: false,
    },
  ];

  const trackerSnippet = `<!-- Step 1: Set your config BEFORE the tracker loads -->
<script>
  window.__rewind = {
    token: '${projectToken ?? 'YOUR_PROJECT_TOKEN'}',
    endpoint: 'http://localhost:3001/ingest',
  };
</script>

<!-- Step 2: Load the tracker (auto-starts on load) -->
<script src="http://localhost:3001/tracker/tracker.js"></script>`;

  const reactSnippet = `// In your main.tsx or App.tsx
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

  return <div>Your App Here</div>;
}`;

  const nextJsSnippet = `// In your app/layout.tsx
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

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Hero Header */}
      <div className="relative glass rounded-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-green)]/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--color-accent-green)] opacity-[0.04] blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-[var(--color-accent-green)] shadow-[0_0_8px_var(--color-accent-green)] animate-pulse" />
            <span className="text-xs font-mono text-[var(--color-accent-green)] uppercase tracking-widest">Getting Started</span>
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-white mb-3">
            Welcome to Rewind
          </h1>
          <p className="text-neutral-400 text-lg max-w-xl leading-relaxed">
            You're just a few steps away from recording your first user session. Follow the guide below to get set up in under 2 minutes.
          </p>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-0">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all w-full ${
                  activeStep === step.id ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${
                  step.completed
                    ? 'border-[var(--color-accent-green)] bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                    : activeStep === step.id
                    ? 'border-white/40 bg-white/10 text-white'
                    : 'border-white/10 bg-transparent text-neutral-500'
                }`}>
                  {step.completed
                    ? <CheckCircle2 className="h-4 w-4" />
                    : <span className="text-sm font-bold">{step.id + 1}</span>
                  }
                </div>
                <div className="text-left hidden sm:block">
                  <div className={`text-sm font-semibold ${activeStep === step.id ? 'text-white' : step.completed ? 'text-[var(--color-accent-green)]' : 'text-neutral-400'}`}>
                    {step.title}
                  </div>
                </div>
              </button>
              {i < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-neutral-700 shrink-0 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass rounded-2xl p-8">

        {/* Step 0: Create a Project */}
        {activeStep === 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/30 flex items-center justify-center text-[var(--color-accent-green)]">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">Create a Project</h2>
                <p className="text-neutral-400 text-sm mt-1">A project generates a unique token to identify your application.</p>
              </div>
            </div>

            <div className="border border-[var(--color-border-dark)] rounded-xl overflow-hidden">
              <div className="bg-white/5 px-5 py-4 border-b border-[var(--color-border-dark)]">
                <h3 className="font-medium text-white">What is a Project?</h3>
              </div>
              <div className="p-5 space-y-3 text-sm text-neutral-400 leading-relaxed">
                <p>Every application you want to track needs its own <strong className="text-white">Project Token</strong>. This token tells the Rewind Ingestor which project the incoming sessions belong to.</p>
                <p>You can have multiple projects — for example, one for your marketing site and one for your main app.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Link
                href="/dashboard/projects"
                className="flex items-center gap-2 rounded-lg bg-[var(--color-accent-green)] px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[var(--color-accent-green-hover)]"
              >
                Go to Projects
                <ArrowRight className="h-4 w-4" />
              </Link>
              {hasProject && (
                <button
                  onClick={() => setActiveStep(1)}
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-border-dark)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/10"
                >
                  I've created a project
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Install Tracker */}
        {activeStep === 1 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Code2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">Install the Tracker</h2>
                <p className="text-neutral-400 text-sm mt-1">Paste the script into your site's HTML. That's all it takes.</p>
              </div>
            </div>

            {!hasProject && (
              <div className="flex items-start gap-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">
                <div className="h-5 w-5 shrink-0 text-yellow-400 mt-0.5">⚠</div>
                <div>
                  <p className="text-sm font-medium text-yellow-300">You need a project token first</p>
                  <p className="text-xs text-yellow-400/70 mt-1">
                    <button onClick={() => setActiveStep(0)} className="underline hover:text-yellow-300">Go back to Step 1</button> and create a project to get your token.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-300 mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">A</span>
                  Via Script Tag (Recommended)
                </h3>
                <p className="text-xs text-neutral-500 mb-2">Add this to the <code className="text-neutral-300 bg-white/5 px-1 rounded">&lt;head&gt;</code> of every page you want to track.</p>
                <CodeBlock code={trackerSnippet} language="html" />
              </div>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-neutral-600 font-mono">FRAMEWORKS</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-300 mb-1 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">B</span>
                    React (Vite/CRA)
                  </h3>
                  <p className="text-xs text-neutral-500 mb-2">Initialize the tracker in your root component.</p>
                  <CodeBlock code={reactSnippet} language="tsx" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-neutral-300 mb-1 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">C</span>
                    Next.js (App Router)
                  </h3>
                  <p className="text-xs text-neutral-500 mb-2">Use the built-in Script component in layout.tsx.</p>
                  <CodeBlock code={nextJsSnippet} language="tsx" />
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-accent-green)]/5 border border-[var(--color-accent-green)]/20 rounded-xl p-4">
              <p className="text-xs text-[var(--color-accent-green)]/80 font-mono">
                💡 The tracker starts recording <strong>automatically</strong> when the script loads — as long as <code>window.__rewind.token</code> is set before it.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-accent-green)] px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[var(--color-accent-green-hover)]"
              >
                Script is installed
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveStep(0)}
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Waiting for sessions */}
        {activeStep === 2 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Rocket className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">You're all set!</h2>
                <p className="text-neutral-400 text-sm mt-1">Visit your tracked website and sessions will appear here within seconds.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'DOM Events', desc: 'Every mouse move, click, and scroll is captured invisibly.', color: 'text-[var(--color-accent-green)]', bg: 'bg-[var(--color-accent-green)]/10', border: 'border-[var(--color-accent-green)]/20' },
                { label: 'Network Activity', desc: 'All fetch and XHR requests are logged with timing.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                { label: 'Console Logs', desc: 'Errors, warnings, and logs are captured alongside each session.', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-5 border ${item.bg} ${item.border}`}>
                  <div className={`text-sm font-bold mb-2 ${item.color}`}>{item.label}</div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="border border-[var(--color-border-dark)] rounded-xl p-5 bg-black/30">
              <h3 className="font-medium text-white mb-4">🚀 Verify it's working</h3>
              <ol className="space-y-3 text-sm text-neutral-400">
                <li className="flex gap-3">
                  <span className="text-[var(--color-accent-green)] font-bold shrink-0">1.</span>
                  Open your tracked website in a browser tab.
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--color-accent-green)] font-bold shrink-0">2.</span>
                  Click around on a few pages and interact with the page.
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--color-accent-green)] font-bold shrink-0">3.</span>
                  Come back here and <strong className="text-white">refresh this page</strong> — your session will appear.
                </li>
              </ol>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-[var(--color-accent-green)] px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[var(--color-accent-green-hover)]"
                onClick={() => window.location.reload()}
              >
                <Play className="h-4 w-4" />
                Check for Sessions
              </Link>
              <button
                onClick={() => setActiveStep(1)}
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Quick links footer */}
      <div className="glass rounded-2xl p-5">
        <div className="text-xs text-neutral-500 uppercase tracking-widest mb-4 font-semibold">Helpful Links</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Read the Architecture Docs', href: '/dashboard/settings', desc: 'Understand how all the services connect together.' },
            { label: 'Manage Projects & Tokens', href: '/dashboard/projects', desc: 'View and manage your project tracking tokens.' },
            { label: 'View Analytics', href: '/dashboard/analytics', desc: 'Session trends, error rates, and network stats.' },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/5 hover:border-white/10 transition-all group"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-white mb-1 group-hover:text-[var(--color-accent-green)] transition-colors">{link.label}</div>
                <div className="text-xs text-neutral-500">{link.desc}</div>
              </div>
              <ExternalLink className="h-4 w-4 text-neutral-700 group-hover:text-[var(--color-accent-green)] transition-colors shrink-0 mt-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
