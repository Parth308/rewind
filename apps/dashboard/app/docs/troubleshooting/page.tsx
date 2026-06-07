import { Metadata } from 'next';
import { CodeBlock } from '../../../components/docs/code-block';

export const metadata: Metadata = {
  title: 'Troubleshooting - Rewind Docs',
};

export default function TroubleshootingPage() {
  return (
    <>
      <h1 id="troubleshooting">Troubleshooting & FAQ</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Encountering issues while deploying or running Rewind? Here are the most common self-hosting pitfalls and how to resolve them.
      </p>

      <h2 id="websocket-disconnects">WebSockets Disconnecting Immediately</h2>
      <p>
        <strong>Symptom:</strong> Your browser console shows the tracker repeatedly connecting to the Ingestor (<code>ws://...</code>) but immediately closing with code <code>1006</code> or <code>1008</code>.
      </p>
      <p><strong>Solutions:</strong></p>
      <ul>
        <li><strong>Nginx Proxy Configuration:</strong> If you placed Nginx in front of the Ingestor container, you must configure it to upgrade the connection. Add the following to your Nginx location block:</li>
      </ul>
      
      <CodeBlock language="nginx" code={`location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
}`} />
      <ul>
        <li><strong>Invalid Project Token:</strong> The Ingestor immediately drops WebSocket connections if the `projectToken` sent in the initialization payload does not exist in the PostgreSQL database. Double-check your token in the dashboard.</li>
      </ul>

      <h2 id="oom-crashes">Database / Worker OOM Crashes</h2>
      <p>
        <strong>Symptom:</strong> The PostgreSQL container or the Worker container randomly restarts under high traffic load, and Docker reports an <code>OOMKilled</code> status.
      </p>
      <p><strong>Solutions:</strong></p>
      <ul>
        <li><strong>Add a Swap File:</strong> As mentioned in the <a href="/docs/scaling" className="text-[var(--color-accent-green)] hover:underline">Hardware & Scaling</a> guide, running this stack on a 1GB RAM VPS requires a swap file. Linux will kill Postgres first when RAM runs out.</li>
        <li><strong>Limit BullMQ Concurrency:</strong> If the worker is consuming too much RAM parsing massive payloads, you can limit the concurrency of the BullMQ consumer via environment variables to process fewer jobs in parallel.</li>
      </ul>

      <h2 id="cors-errors">Dashboard CORS Errors</h2>
      <p>
        <strong>Symptom:</strong> You can log into the dashboard, but no sessions load. The browser network tab shows CORS (Cross-Origin Resource Sharing) failures when contacting the API.
      </p>
      <p><strong>Solutions:</strong></p>
      <ul>
        <li>Check the <code>FRONTEND_URL</code> environment variable in your API container. The API uses this variable to strictly define the allowed `Access-Control-Allow-Origin` header. It must perfectly match the URL you are viewing the dashboard from (e.g., <code>https://app.yourdomain.com</code> without a trailing slash).</li>
      </ul>
    </>
  );
}
