import { Metadata } from 'next';
import { CodeBlock } from '../../../components/docs/code-block';
import { PackageManagerTabs } from '../../../components/docs/package-manager-tabs';

export const metadata: Metadata = {
  title: 'Node.js SDK - Rewind Docs',
};

export default function NodeSdkPage() {
  return (
    <>
      <h1 id="node-sdk">Node.js SDK</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Session replay is strictly visual, but many critical failures happen purely on the backend. You can use the <code>rewind-node</code> SDK to push backend context, errors, and user identities directly into the active user's session timeline!
      </p>

      <h2 id="installation">Installation</h2>
      <p>Install the SDK using your preferred package manager:</p>
      
      <PackageManagerTabs packageName="rewind-node" />

      <h2 id="usage">Usage</h2>
      <p>
        To use the SDK, you must pass <code>window.Rewind.sessionId</code> from your frontend to your backend (e.g., via an <code>x-rewind-session-id</code> HTTP header).
      </p>

      <h3 id="express-middleware">Express Middleware (Easiest)</h3>
      <p>
        The easiest way to integrate the SDK in an Express application is using our built-in middleware. This automatically extracts the <code>x-rewind-session-id</code> header and injects <code>req.rewind</code> into all your endpoints.
      </p>

      <CodeBlock language="typescript" code={`import { Rewind } from 'rewind-node';
import express from 'express';

const rewind = new Rewind({
  projectToken: 'YOUR_PROJECT_TOKEN',
  ingestorUrl: 'https://ingest.yourdomain.com' // Omit for local development (defaults to port 3001)
});

const app = express();

app.use(rewind.expressMiddleware());

app.post('/checkout', async (req, res) => {
  try {
    // Identify the user on the session
    await req.rewind.identify('user-123', { plan: 'pro' });

    // Track custom business events
    await req.rewind.track('Payment Succeeded', { amount: 99 });
    
    res.json({ success: true });
  } catch (error) {
    // Capture backend exceptions directly to the session replay timeline
    await req.rewind.captureException(error, { route: '/checkout' });
    
    res.status(500).send('Error');
  }
});`} />

      <h3 id="manual-usage">Manual Usage</h3>
      <p>
        If you aren't using Express, you can manually orchestrate these calls by instantiating the client and passing the <code>sessionId</code> directly to the methods:
      </p>

      <CodeBlock language="typescript" code={`import { Rewind } from 'rewind-node';

const rewind = new Rewind({ projectToken: 'YOUR_PROJECT_TOKEN' });

// Track a custom event
await rewind.track(sessionId, 'Order Shipped', { orderId: '123' });

// Identify the session
await rewind.identify(sessionId, 'user-123', { email: 'user@test.com' });

// Capture a server-side exception
await rewind.captureException(sessionId, new Error('Database timeout'), { query: 'SELECT *' });`} />

      <h2 id="features">Features</h2>
      <ul>
        <li><strong>Custom Events:</strong> Stored as <code>jsonb</code> payloads. They power the funnel builder and appear in the session's Events tab, enriching every replay with your backend business context.</li>
        <li><strong>User Identification:</strong> Link a backend user ID and traits to an anonymous frontend session.</li>
        <li><strong>Exception Capturing:</strong> Exceptions captured via <code>captureException</code> will appear seamlessly alongside frontend browser logs (as <code>console.error</code>) in the session replay.</li>
      </ul>
    </>
  );
}
