import { Metadata } from 'next';
import { ReplayDemo } from '../../../components/marketing/replay-demo';
import { CodeBlock } from '../../../components/docs/code-block';

export const metadata: Metadata = {
  title: 'Features - Rewind Docs',
};

export default function FeaturesPage() {
  return (
    <>
      <h1 id="features">Core Features</h1>
      
      <p className="text-xl text-neutral-300 mb-8">
        Rewind goes beyond simple screen recording by capturing the actual semantic structure of the DOM, intercepting XMLHttpRequests natively, and proxying the Console API.
      </p>

      <div className="my-12 p-1 border border-[var(--color-border-dark)] bg-[#050505] rounded-3xl overflow-hidden relative">
        <ReplayDemo />
      </div>

      <h2 id="embedding-the-tracker">The Tracker Mechanism</h2>
      <p>
        The tracker is a tiny, highly-optimized JavaScript snippet that sits quietly on your site. It works by capturing the initial state of the DOM as a snapshot and then uses a <code>MutationObserver</code> to record incremental changes (deltas). This ensures that even on complex Single Page Applications (SPAs) with virtual DOMs (like React or Vue), the recording is pixel-perfect without recording an actual heavy video file.
      </p>

      <h3 id="plain-html">Implementation in HTML</h3>
      <CodeBlock language="html" code={`<script src="http://localhost:3001/tracker.js"></script>
<script>
  window.Rewind.init({
    projectToken: 'YOUR_SECURE_PROJECT_TOKEN',
    ingestorUrl:  'wss://ingest.yourdomain.com'
  });
</script>`} />

      <h3 id="react-nextjs">Implementation in Next.js (App Router)</h3>
      <p>For modern React frameworks like Next.js, we recommend utilizing the framework's native Script component with the <code>afterInteractive</code> strategy so your main thread is never blocked during Initial Page Load.</p>
      <CodeBlock language="tsx" code={`import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script src="https://ingest.yourdomain.com/tracker.js" strategy="afterInteractive"
          onLoad={() => {
            window.Rewind.init({
              projectToken: 'YOUR_SECURE_PROJECT_TOKEN',
              ingestorUrl:  'wss://ingest.yourdomain.com',
            });
          }}
        />
      </body>
    </html>
  );
}`} />

      <h2 id="session-replay">High-Fidelity Session Replay</h2>
      <p>
        The core of the Dashboard experience is the Session Replay interface. We utilize a heavily modified version of <code>rrweb-player</code> configured to match the <strong>Terminal Brutalist</strong> design system of the dashboard.
      </p>
      <ul>
        <li><strong>DOM Playback:</strong> Watch exactly what the user saw. Hover states, active inputs, dropdown selections, and exact scroll positions are preserved.</li>
        <li><strong>Network Synchronization:</strong> The tracker intercepts <code>window.fetch</code> and <code>XMLHttpRequest</code> at the browser level. We record the request URL, method, status code, and latency duration, overlaying it on the exact millisecond it occurred in the video timeline.</li>
        <li><strong>Console Synchronization:</strong> We proxy <code>console.log</code>, <code>console.warn</code>, and <code>console.error</code>. If a JavaScript exception is thrown, you can pause the session and view the exact stack trace within the dashboard's side panel.</li>
      </ul>

      <h2 id="custom-events">Tracking Custom Events</h2>
      <p>
        You can track business-specific custom events natively within the session replay timeline. These events are synchronized precisely with the recorded DOM mutations and appear as distinct markers on the session scrubber, as well as in the dedicated Events tab.
      </p>
      <CodeBlock language="javascript" code={`window.Rewind.track('Purchase Completed', {
  orderId: '12345',
  amount: 99.99,
  currency: 'USD',
  success: true
});`} />

      <h2 id="conversion-funnels">Conversion Funnels</h2>
      <p>
        Rewind features a powerful visual funnel builder to help you identify exactly where users drop off in your product flows. You can chain together URL visits and Custom Events to construct sequential funnels.
      </p>
      <ul>
        <li><strong>Step-by-step Analytics:</strong> See the exact conversion rate and drop-off count at every step in a multi-step workflow.</li>
        <li><strong>Drop-off Replay Correlation:</strong> With one click, instantly launch a filtered list of session replays for users who abandoned the flow at a specific step, allowing you to see <em>why</em> they left.</li>
        <li><strong>Saved Funnels:</strong> Save complex, multi-step queries to your project to quickly monitor your core metrics on a recurring basis.</li>
      </ul>

      <h2 id="hybrid-search">Intelligent Hybrid Search</h2>
      <p>
        Rewind features a state-of-the-art hybrid search engine that allows you to query your databank using natural language to uncover complex user behaviors. 
      </p>
      <ul>
        <li><strong>True Semantic Search:</strong> Powered by AI embeddings and <code>pgvector</code>, you can search for concepts like <em>"users who rage clicked on checkout"</em>. The engine understands the intent and finds mathematically similar session narratives.</li>
        <li><strong>Smart Query Routing:</strong> To save latency and API costs, Rewind analyzes every query. If you search for an exact identifier (like a UUID, an email, a URL path, or a short acronym), the engine intelligently bypasses the LLM and executes a lightning-fast PostgreSQL text match instead.</li>
        <li><strong>Forced Exact Match:</strong> You can explicitly force a high-speed direct text search at any time by wrapping your query in quotes, e.g., <code>"checkout failed"</code>.</li>
      </ul>

      <h2 id="system-metrics">Live System Telemetry</h2>
      <p>
        Managing a self-hosted infrastructure can be daunting. Rewind provides a built-in <code>/dashboard/system</code> route that acts as a mission control center. This pulls live metrics directly from your infrastructure:
      </p>
      <ul>
        <li><strong>PostgreSQL DB Size:</strong> Monitors disk footprint to ensure you have enough retention capacity.</li>
        <li><strong>Redis Memory Footprint:</strong> Tracks the active memory state of your BullMQ queues.</li>
        <li><strong>Queue Telemetry:</strong> Live indicators of Active, Pending, and Failed jobs processed by the Worker.</li>
        <li><strong>Host OS Status:</strong> Reads directly from Node's <code>os</code> module to report CPU load averages and RAM saturation of the underlying VPS.</li>
      </ul>
    </>
  );
}
