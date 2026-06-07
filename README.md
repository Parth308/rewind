<div align="center">

# Rewind

**The open-source intelligence layer for your frontend.**

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](#)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs&logoColor=white)](#)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)](#)
[![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-EF4444?logo=turborepo&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](#)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

*Drop a single `<script>` tag to get full DOM replay, network logs, and console capture. Empower your support, engineering, and product teams to understand user behavior instantly.*

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Monorepo Structure](#monorepo-structure)
6. [Services at a Glance](#services-at-a-glance)
7. [Getting Started](#getting-started)
   - [Local Development](#option-a--local-development-recommended)
   - [Production VPS](#option-b--production-single-server-vps)
8. [Embedding the Tracker](#embedding-the-tracker)
9. [Database Management](#database-management)
10. [Environment Variables](#environment-variables)
11. [Contributing](#contributing)

---

## Documentation

Full documentation (including Installation, Hardware Scaling, and AI Setup) is built directly into the Next.js application with a beautiful "Terminal Brutalist" interface. 
Once you start the application locally, visit **[http://localhost:3000/docs](http://localhost:3000/docs)**.

---

## Overview

**Rewind** is a self-hosted, privacy-friendly alternative to tools like FullStory or LogRocket. It is built as a **Turborepo + pnpm** monorepo and is designed to run efficiently on a single low-cost VPS while remaining horizontally scalable.

A lightweight JavaScript snippet (the **Tracker**) is embedded on any web page. It silently records DOM mutations, network requests, and console output, then streams the data to the **Ingestor**. The Ingestor queues the work via **BullMQ / Redis** and a **Worker** persists it into **PostgreSQL**. The **Dashboard** lets you browse projects, inspect sessions, and replay them frame-by-frame alongside synchronized network and console timelines.

### Use Cases
- **Customer Support:** A user submits a ticket saying "I can't checkout." The support agent pulls up the user's latest session clip to see exactly what they did, skipping the painful "can you reproduce this?" back-and-forth.
- **Engineering & Debugging:** Stop trying to reproduce complex frontend bugs locally. Watch the exact sequence of user events alongside synchronized network requests and console errors to pinpoint the root cause immediately.
- **Product & UX Analytics:** Discover hidden friction points. Identify "rage clicks", track where users abandon their carts, and watch the sessions of users who dropped off to understand *why* they left.
- **AI-Powered Insights:** Query sessions using natural language (e.g., "Show me users who got a payment error") and generate automated summaries of a user's journey.

---

## Features

| Category | Capability |
|---|---|
| 🎥 **Recording** | Full DOM capture via `rrweb` (mutations, inputs, scroll, resize) |
| 🌐 **Network** | `fetch` & `XMLHttpRequest` intercept — URL, method, status, duration |
| 🖥️ **Console** | Captures `log`, `warn`, `error`, `info`, `debug` with timestamps |
| ⚡ **Transport** | WebSocket primary, HTTP batch fallback, automatic retry |
| 📬 **Queue** | BullMQ + Redis — decouples ingestion from storage, handles bursts |
| 🗄️ **Storage** | PostgreSQL + Drizzle ORM — type-safe, schema-first |
| 🔐 **Auth** | JWT-based API authentication for dashboard users |
| 🎬 **Replay** | `rrweb-player` with synchronized network + console side-panel |
| 📊 **System** | Live system metrics page (DB size, Redis memory, BullMQ queue counts, host info) |
| 🧠 **AI Summaries** | Vercel AI SDK integration (Google, OpenAI, Anthropic) to summarize sessions |
| 🔍 **Vector Search** | `pgvector` embeddings to search sessions by intent rather than keywords |
| 🐳 **Deploy** | Multi-stage Dockerfile with `pnpm prune --prod` for lean production images |

---

## Tech Stack

```
Runtime        Node.js 20 + TypeScript 5
Monorepo       Turborepo · pnpm workspaces
Dashboard      Next.js 15 (App Router) · React 19 · Tailwind CSS · Framer Motion
API            Express 4 · JWT (jsonwebtoken) · Zod
Ingestor       Express 4 · ws (WebSocket)
Worker         BullMQ consumers
Database       PostgreSQL 16 · Drizzle ORM
Queue          BullMQ · ioredis · Redis 7
Recording      rrweb · rrweb-player
Tracker build  esbuild (IIFE bundle, ~12 kB gzipped)
Containers     Docker · docker-compose
```

---

## System Architecture

### End-to-End Data Flow

```mermaid
flowchart LR
    subgraph Browser["🌐 Client Browser"]
        direction TB
        Site["Your Website"] -- "DOM events\nnetwork / console" --> T["📦 Tracker\n(tracker.js)"]
    end

    subgraph Ingestor["⚡ Ingestor  :3001"]
        direction TB
        WS["WebSocket\nServer"] -- "validates\nproject token" --> Q["BullMQ\nProducer"]
    end

    subgraph Queue["🔴 Redis"]
        JQ[("events\nqueue")]
    end

    subgraph Worker["⚙️ Worker"]
        WK["BullMQ\nConsumer"] -- "Drizzle ORM" --> PG
    end

    subgraph Storage["🗄️ PostgreSQL"]
        PG[("rewind\ndatabase")]
    end

    subgraph DashLayer["🖥️ Dashboard  :3000"]
        direction TB
        UI["Next.js App"] -- "REST calls" --> API["API  :3002"]
        UI -- "direct server\nqueries" --> PG
        API -- "JWT auth\n+ queries" --> PG
    end

    T -- "WebSocket\nbatch" --> WS
    Q --> JQ
    JQ --> WK
```

### Request Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant Browser
    participant Tracker
    participant Ingestor
    participant Redis
    participant Worker
    participant Postgres
    participant Dashboard

    Browser->>Tracker: User interaction (click, scroll, navigation)
    Tracker->>Tracker: Buffer events (rrweb + network + console)
    Tracker->>Ingestor: Send batch over WebSocket
    Ingestor->>Ingestor: Validate project token
    Ingestor->>Redis: Enqueue job (BullMQ)
    Ingestor-->>Tracker: ACK

    Redis->>Worker: Dequeue job
    Worker->>Postgres: INSERT events (Drizzle ORM)

    Dashboard->>Postgres: Query sessions & events
    Dashboard->>Dashboard: Render replay with rrweb-player
```

---

## Monorepo Structure

```
rewind/
├── apps/
│   ├── tracker/          # Vanilla JS snippet (esbuild → dist/tracker.js)
│   ├── ingestor/         # Express + WebSocket server  [port 3001]
│   ├── worker/           # BullMQ consumer process
│   ├── api/              # REST API (auth, projects, sessions)  [port 3002]
│   └── dashboard/        # Next.js 15 dashboard  [port 3000]
│
├── packages/
│   └── shared/           # Drizzle schema + Zod validators (shared across apps)
│
├── docker-compose.yml         # Local dev databases (Postgres :5433, Redis :6379)
├── docker-compose.prod.yml    # Full production stack (all services + databases)
├── Dockerfile                 # Multi-stage build for production apps
├── turbo.json                 # Turborepo task graph
├── pnpm-workspace.yaml        # pnpm workspace config
└── .env.example               # Reference environment file
```

---

## Services at a Glance

### 1 · Tracker &nbsp;`apps/tracker`

The tiny script you drop on any website.

- Uses **rrweb** to record all DOM mutations, user inputs, scroll events, and viewport resizes.
- Monkey-patches `window.fetch`, `XMLHttpRequest`, and `console.*` to capture network activity and logs without affecting page behaviour.
- Events are buffered locally and flushed as compressed JSON batches over a **WebSocket** connection. Falls back to HTTP `POST` when WebSocket is unavailable.
- Built with **esbuild** into a single IIFE bundle (`dist/tracker.js`, ~12 kB gzipped).

Key files: `src/index.ts` · `src/capture/network.ts` · `src/capture/console.ts` · `build.js`

---

### 2 · Ingestor &nbsp;`apps/ingestor` &nbsp;— port `3001`

The high-throughput ingestion gateway.

- **Express** HTTP server + **ws** WebSocket server running on the same port.
- Authenticates every connection by looking up the `projectToken` in PostgreSQL.
- Immediately offloads validated batches to a **BullMQ** queue in **Redis** — the Ingestor never does heavy processing, keeping latency minimal.
- Exposes a `/health` endpoint that checks Redis connectivity; the Dashboard sidebar uses this to show a live/offline indicator.

---

### 3 · Worker &nbsp;`apps/worker`

The background queue processor.

- Runs one or more **BullMQ** consumers subscribed to the `events` queue.
- Transforms raw tracker payloads into normalised DB rows and bulk-inserts them via **Drizzle ORM**.
- Can be scaled horizontally — spin up additional worker containers to handle ingestion spikes without touching the Ingestor or API.

---

### 4 · API &nbsp;`apps/api` &nbsp;— port `3002`

The REST backend for the Dashboard.

- Organised into focused routers: `auth`, `projects`, `sessions`.
- JWT-based authentication: issues signed tokens on `/auth/login` and validates them on all protected routes via Express middleware.
- Uses the same **Drizzle ORM** client as the Worker for consistent, type-safe queries.

---

### 5 · Dashboard &nbsp;`apps/dashboard` &nbsp;— port `3000`

The main user interface.

- **Next.js 15** App Router with React Server Components for fast, data-rich pages.
- "Terminal Brutalist" design system — dark background (`#050505`), lime-green accents, glassmorphism cards, and serif typography.
- Session list with filtering and sorting; click any session to open the **Replay** view.
- **Replay** view renders `rrweb-player` and synchronises a side-panel timeline of network requests and console logs scrubbed to the current playback time.
- **System** page (`/dashboard/system`) shows live metrics: PostgreSQL DB size, Redis memory, BullMQ queue counts, host OS uptime, RAM usage, and CPU info — all fetched server-side with a 10-second revalidation window.
- **Onboarding Guide** walks new users through tracker installation with ready-to-copy code snippets for plain HTML, React/Vite, and Next.js.

---

### 6 · Shared &nbsp;`packages/shared`

The single source of truth for data shapes.

- **Drizzle ORM** schema: `users`, `projects`, `sessions`, `events` tables with indexes defined in the new object-notation style.
- **Zod** validators mirroring the schema — imported by both the API (for request validation) and the Dashboard (for type-safe server queries).

---

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- [pnpm 9+](https://pnpm.io) — `npm i -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local databases)

---

### Option A — Local Development (Recommended)

Run all services locally with hot-reloading. Docker is only used for the databases.

```bash
# 1. Clone the repo
git clone https://github.com/Parth308/rewind.git
cd rewind

# 2. Copy environment variables
cp .env.example .env
#    Open .env and review the defaults — they work out of the box for local dev.

# 3. Install all workspace dependencies
pnpm install

# 4. Start Postgres (port 5433) and Redis (port 6379)
docker compose up -d

# 5. Push the database schema
pnpm run db:push

# 6. Build the Tracker bundle (only needed once, or after tracker changes)
cd apps/tracker && pnpm install && pnpm run build && cd ../..

# 7. Start all services in parallel with hot-reloading
pnpm run dev
```

Services will be available at:

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| Ingestor | http://localhost:3001 |
| API | http://localhost:3002 |
| Postgres | `localhost:5433` |
| Redis | `localhost:6379` |

---

### Option B — Production (Single-Server VPS)

Everything runs inside Docker — no Node.js or pnpm needed on the host.

```bash
# 1. Clone the repo on your VPS
git clone https://github.com/Parth308/rewind.git
cd rewind

# 2. Configure environment
cp .env.example .env
#    Edit .env: ensure DATABASE_URL uses host "postgres"
#                         REDIS_URL uses host "redis"
#                         API_URL uses "http://api:3002"

# 3. Build images and start all containers
docker compose -f docker-compose.prod.yml up --build -d

# 4. (First run only) Push the database schema
docker compose -f docker-compose.prod.yml exec api pnpm run db:push
```

The multi-stage **Dockerfile** uses `pnpm fetch` + `pnpm install --offline` for layer caching, then `pnpm prune --prod` to strip dev dependencies before creating the final runner image — keeping production images lean.

---

## Embedding the Tracker

After building the Tracker (`pnpm run build` inside `apps/tracker`), the bundle is automatically served by the Ingestor at `GET /tracker.js`.

### Plain HTML

```html
<script src="http://localhost:3001/tracker.js"></script>
<script>
  window.Rewind.init({
    projectToken: 'your-project-token',
    ingestorUrl:  'ws://localhost:3001'
  });
</script>
```

### React / Vite

```tsx
// src/main.tsx  (or App.tsx)
import { useEffect } from 'react';

useEffect(() => {
  const script = document.createElement('script');
  script.src = 'http://localhost:3001/tracker.js';
  script.onload = () => {
    (window as any).Rewind.init({
      projectToken: 'your-project-token',
      ingestorUrl:  'ws://localhost:3001',
    });
  };
  document.head.appendChild(script);
}, []);
```

### Next.js (App Router)

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Script src="http://localhost:3001/tracker.js" strategy="afterInteractive"
          onLoad={() => {
            (window as any).Rewind.init({
              projectToken: 'your-project-token',
              ingestorUrl:  'ws://localhost:3001',
            });
          }}
        />
      </body>
    </html>
  );
}
```

> **Tip:** Replace `localhost:3001` with your production Ingestor domain when deploying.

---

## Database Management

All schema changes live in `packages/shared/src/schema.ts`.

```bash
# Apply schema changes to the database
pnpm run db:push

# Generate SQL migration files (optional, for audit trail)
pnpm run db:generate

# Open Drizzle Studio (visual DB browser)
cd packages/shared
npx drizzle-kit studio
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@postgres:5432/rewind` | PostgreSQL connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `JWT_SECRET` | — | Secret used to sign and verify JWTs |
| `API_PORT` | `3002` | Port for the REST API |
| `INGESTOR_PORT` | `3001` | Port for the Ingestor |
| `FRONTEND_URL` | `http://localhost:3000` | Dashboard URL (used for CORS) |
| `API_URL` | `http://api:3002` | API URL as seen from the Dashboard |
| `TRACKER_INGESTOR_URL` | `ws://localhost:3001` | WebSocket URL embedded in tracker snippet |

> For local development, copy `.env.example` to `.env` and use `localhost` hostnames. For production Docker deployments, use the Docker service names (`postgres`, `redis`, `api`).

---

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feat/your-feature`
2. Install dependencies: `pnpm install`
3. Make your changes — keep commits small and descriptive.
4. Run the linter: `pnpm run lint`
5. Open a Pull Request with a clear description of what changed and why.

---

<div align="center">

Made with ❤️ by **Parth308**

</div>