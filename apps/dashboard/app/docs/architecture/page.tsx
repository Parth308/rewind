import { Metadata } from 'next';
import { ArchitectureFlow } from '../../../components/marketing/architecture-flow';

export const metadata: Metadata = {
  title: 'Architecture - Rewind Docs',
};

export default function ArchitecturePage() {
  return (
    <>
      <h1 id="architecture">System Architecture</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Rewind was fundamentally designed around decoupling. Ingestion bursts must never impact the database, and dashboard queries must never impact ingestion throughput.
      </p>

      <div className="my-12 w-full overflow-hidden border border-[var(--color-border-dark)] rounded-2xl bg-[#050505]">
        <ArchitectureFlow />
      </div>

      <h2 id="data-flow">The Ingestion Pipeline</h2>
      <p>
        To run efficiently on a single $6/month VPS while scaling to handle massive bursts of traffic, Rewind uses a classic Queue-Worker paradigm. Here is the exact path a piece of user data takes:
      </p>
      <ol>
        <li><strong>Client Buffering:</strong> The Tracker script does not send every mouse movement individually. It batches DOM mutations, network logs, and console events locally, compressing them into JSON payloads.</li>
        <li><strong>WebSocket Streaming (Port 3001):</strong> The browser establishes a persistent WebSocket connection to the Ingestor service. The Ingestor verifies the <code>projectToken</code> immediately against a cached PostgreSQL query to ensure unauthorized data is dropped at the edge.</li>
        <li><strong>Redis / BullMQ Buffer:</strong> Once validated, the payload is immediately serialized and pushed into a Redis queue via BullMQ. <em>The Ingestor does zero data transformation or database writing.</em> This allows the WebSocket server to acknowledge the batch in less than 2 milliseconds.</li>
        <li><strong>Worker Dequeuing:</strong> A separate background Node process (the Worker) continuously polls Redis. It pulls payloads off the queue at a controlled rate, ensuring the database is never overwhelmed by sudden spikes in web traffic.</li>
        <li><strong>Drizzle ORM Bulk Inserts:</strong> The worker normalizes the JSON payloads into strongly-typed PostgreSQL rows and executes highly efficient bulk <code>INSERT</code> statements to persist the data.</li>
      </ol>

      <h2 id="services">Microservices Breakdown</h2>
      
      <h3 id="ingestor">Ingestor (apps/ingestor)</h3>
      <p>
        This service is designed strictly for high concurrency. It runs both an Express HTTP server (for serving the <code>tracker.js</code> script) and a <code>ws</code> WebSocket server on the same port. By offloading all heavy lifting to Redis immediately, a single instance can easily sustain thousands of concurrent connections.
      </p>
      
      <h3 id="worker">Worker (apps/worker)</h3>
      <p>
        The background process runs one or more BullMQ consumers. Because it is completely decoupled from the internet-facing ingestion port, you can horizontally scale this component. If your queue backs up during a traffic spike, simply spin up more worker containers to chew through the Redis queue faster.
      </p>
      
      <h3 id="api">API (apps/api)</h3>
      <p>
        Serving the dashboard requires a secure boundary. The API operates on Port 3002 and enforces JWT-based authentication for all routes. It acts as the intermediary between the Next.js Dashboard and the PostgreSQL database, executing Drizzle queries to fetch sessions, projects, and user details.
      </p>
      
      <h3 id="dashboard">Dashboard (apps/dashboard)</h3>
      <p>
        Built on the Next.js 15 App Router, this is where the user interface lives. We leverage React Server Components (RSC) to securely pull data from the API and render it server-side, reducing client-side bundle size and vastly improving First Contentful Paint (FCP) metrics.
      </p>
    </>
  );
}
