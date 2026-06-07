import { Metadata } from 'next';
import { TrustStats } from '../../components/marketing/trust-stats';
import { AsymmetricMatrix } from '../../components/marketing/asymmetric-matrix';

export const metadata: Metadata = {
  title: 'Overview - Rewind Docs',
};

export default function OverviewPage() {
  return (
    <>
      <h1 id="overview">Overview</h1>
      <p className="text-xl leading-relaxed text-neutral-300">
        <strong>Rewind</strong> is an open-source intelligence layer for your frontend. It is a self-hosted, privacy-friendly alternative to tools like FullStory or LogRocket, designed to run efficiently on a single low-cost VPS without compromising on modern performance or scale.
      </p>
      
      <div className="my-12 -mx-6 md:mx-0">
        <AsymmetricMatrix />
      </div>

      <h2 id="philosophy">Design Philosophy & Architecture</h2>
      <p>
        Rewind is built around the idea that telemetry should be lightweight, privacy-conscious, and entirely under your control. By dropping a single lightweight <code>&lt;script&gt;</code> tag onto your website, the Rewind Tracker hooks into the underlying browser APIs to record a continuous stream of DOM mutations, network requests, and console events.
      </p>
      <p>
        Unlike heavy, proprietary scripts that slow down your main thread, the Rewind Tracker is optimized using an IIFE bundle via <strong>esbuild</strong>, maintaining a tiny footprint (~12 kB gzipped) while relying on WebSockets for high-throughput, low-latency streaming to the ingestion server.
      </p>
      
      <div className="my-12 w-full">
        <TrustStats />
      </div>

      <h2 id="why-rewind">Why Choose Rewind?</h2>
      <p>
        Traditional session replay tools can cost hundreds or thousands of dollars a month, limiting your ability to retain data or record 100% of your user sessions. Rewind allows you to retain total data ownership while offering a beautiful, "Terminal Brutalist" user experience built on the bleeding edge of the Next.js 15 App Router.
      </p>
      
      <h3 id="use-cases">Core Use Cases</h3>
      <ul>
        <li><strong>Customer Support:</strong> Never ask "can you reproduce this?" again. Support agents can instantly pull up the user's latest session clip to see the exact sequence of clicks, scrolls, and errors that led to a ticket submission.</li>
        <li><strong>Engineering & Debugging:</strong> Stop wasting hours trying to reproduce complex frontend bugs locally. Rewind provides engineers with the exact sequence of DOM events alongside perfectly synchronized network requests and console stack traces.</li>
        <li><strong>Product & UX Analytics:</strong> Discover hidden friction points. Identify "rage clicks", track where users abandon their carts, and watch the exact sessions of users who dropped off to understand <em>why</em> they left.</li>
        <li><strong>AI-Powered Insights:</strong> Query sessions using natural language. Vercel AI SDK integrations allow you to ask "Show me users who got a payment error" and receive a synthesized summary of their journey.</li>
      </ul>
      
      <h2 id="tech-stack">The Stack</h2>
      <p>Rewind leverages an aggressive, modern, type-safe tooling environment across a Turborepo monorepo structure:</p>
      <ul>
        <li><strong>Runtime:</strong> Node.js 20 + TypeScript 5 (Strict Mode)</li>
        <li><strong>Monorepo:</strong> Turborepo · pnpm workspaces for deterministic dependency management.</li>
        <li><strong>Dashboard:</strong> Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Framer Motion for liquid-smooth interactions.</li>
        <li><strong>Backend Ingestion:</strong> Express 4 · <code>ws</code> (WebSockets) · BullMQ · ioredis for distributed task processing.</li>
        <li><strong>Database layer:</strong> PostgreSQL 16 · Drizzle ORM for type-safe schema definitions shared across the entire workspace.</li>
        <li><strong>Recording Engine:</strong> <code>rrweb</code> for exact DOM state reconstruction and <code>rrweb-player</code> customized heavily to match our aesthetic.</li>
      </ul>
    </>
  );
}
