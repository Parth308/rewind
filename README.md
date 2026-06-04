# Rewind Architecture & Getting Started

Rewind is a unified Node.js monorepo (managed with Turborepo and pnpm) that captures, ingests, and replays user sessions and DOM events.

## 🧩 System Architecture Diagram

```mermaid
graph TD
    Client[Client Website / Browser] -->|DOM Events + Logs + Network| Tracker
    Tracker[@rewind/tracker] -->|WebSocket / HTTP Batch| Ingestor
    Ingestor[@rewind/ingestor] -->|BullMQ Queue| Redis[(Redis)]
    Redis -->|Queue Jobs| Worker[@rewind/worker]
    Worker -->|Drizzle ORM Inserts| Postgres[(PostgreSQL)]
    
    Dashboard[@rewind/dashboard] -->|Queries| API[@rewind/api]
    Dashboard -->|Direct DB Queries| Postgres
    API -->|Validates JWT & Queries| Postgres
```

## 🏗️ Architecture & Services Overview

The monorepo is split into several apps and packages, each with a very specific role:

### 1. Tracker (`apps/tracker`)
- **What it does:** The vanilla JS snippet embedded on client websites. 
- **How it works:** It uses `rrweb` to capture DOM mutations, and overrides `fetch`/`XMLHttpRequest`/`console` to capture network requests and logs. It batches these events and sends them over WebSocket (or HTTP fallback) to the Ingestor.
- **How to use it on your site:**
  You can build the tracker script using `pnpm run build` in `apps/tracker`. It will output a bundled JS file in `apps/tracker/dist/index.global.js`.
  Host this file (or serve it via a CDN) and include it in the `<head>` of any website you want to track:
  ```html
  <script src="http://localhost:3000/tracker.js"></script>
  <script>
    // Initialize the tracker with your project token
    window.Rewind.init({
      projectToken: 'your-project-token-here',
      ingestorUrl: 'ws://localhost:3001'
    });
  </script>
  ```

### 2. Ingestor (`apps/ingestor`)
- **What it does:** The high-throughput entry point for tracker data.
- **How it works:** It runs an Express + WebSocket server. It authenticates incoming connections using the Project Token, receives event batches, and immediately offloads them to a Redis queue (BullMQ) to prevent API bottlenecks.
- **Port:** `3001`

### 3. Worker (`apps/worker`)
- **What it does:** The background queue processor.
- **How it works:** It pulls jobs from the Redis `events` queue, processes the raw batch payloads, and safely inserts them into the PostgreSQL database using Drizzle ORM. This allows horizontal scaling if ingestion volume spikes.

### 4. API (`apps/api`)
- **What it does:** The modular REST API for the Dashboard.
- **How it works:** Organized cleanly into separate controllers and routers (`auth`, `projects`, `sessions`). Handles dashboard user authentication (JWT) and project creation/management. 
- **Port:** `3002`

### 5. Dashboard (`apps/dashboard`)
- **What it does:** The main user interface.
- **How it works:** A Next.js 15 app featuring the "Terminal Brutalist" design system. It displays analytics, lists recorded sessions, and features the `Player.tsx` which uses `rrweb-player` to replay the sessions synchronized with network/console logs.
- **Port:** `3000`

### 6. Shared (`packages/shared`)
- **What it does:** The source of truth for the Database.
- **How it works:** Contains the Drizzle ORM schema for PostgreSQL (Users, Projects, Sessions, Events, etc.) using the latest object notation for indexes, as well as shared Zod validators. 

---

## 🚀 How to Run Properly

### Option A: Local Development (Recommended)

When coding or testing locally, you want hot-reloading for your apps but need Docker for your databases.

1. **Copy Environment Variables**
   ```bash
   cp .env.example .env
   ```
2. **Start the Databases (Postgres & Redis)**
   This uses `docker-compose.yml` to spin up the local databases.
   ```bash
   docker compose up -d
   ```
3. **Push Database Schema**
   Ensure your database has the correct tables.
   ```bash
   pnpm run db:push
   ```
4. **Start All Services with Turborepo**
   This single command starts the Dashboard, API, Ingestor, and Worker in parallel with hot-reloading.
   ```bash
   pnpm run dev
   ```

### Option B: Production (Single-Server VPS)

When deploying to your $6/month VPS (2GB RAM), you want everything containerized and running efficiently without development overhead.

1. **Configure Environment**
   Set up your `.env` on the VPS. Make sure you use the `postgres` and `redis` hostnames for your URLs (as shown in the commented sections of `.env.example`).
2. **Spin Up Production**
   This uses `docker-compose.prod.yml` and the root `Dockerfile` to build the optimized Node.js apps and run them alongside Postgres and Redis.
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

## 🗄️ Database Management

To make schema changes:
1. Edit `packages/shared/src/schema.ts`
2. Apply changes: `pnpm run db:push`
3. If you want to use Drizzle Studio (UI) to view the database:
   ```bash
   cd packages/shared
   npx drizzle-kit studio
   ```
