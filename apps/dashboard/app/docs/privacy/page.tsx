import { Metadata } from 'next';
import { CodeBlock } from '../../../components/docs/code-block';

export const metadata: Metadata = {
  title: 'Data Privacy & GDPR - Rewind Docs',
};

export default function PrivacyPage() {
  return (
    <>
      <h1 id="privacy">Data Privacy & GDPR Guide</h1>
      <p className="text-xl text-neutral-300 mb-8">
        One of the primary benefits of self-hosting Rewind is that session data never leaves your VPC. However, you still need to ensure sensitive PII (Personally Identifiable Information) isn't recorded from the client's browser.
      </p>

      <h2 id="default-masking">Default Input Masking</h2>
      <p>
        By default, the Rewind Tracker is configured to be incredibly conservative with user input. 
      </p>
      <ul>
        <li>All <code>&lt;input type="password"&gt;</code> fields are automatically ignored.</li>
        <li>Credit card fields are obfuscated.</li>
        <li>The values typed into these fields are never transmitted over the WebSocket.</li>
      </ul>

      <h2 id="blocking-elements">Blocking Specific Elements</h2>
      <p>
        If you have specific elements on your page that contain highly sensitive data (e.g., medical records, social security numbers, or internal financial data), you can completely block the tracker from recording those DOM nodes.
      </p>
      <p>
        Simply add the <code>rr-block</code> class to any HTML element. Rewind will replace the element with a solid grey placeholder block in the replay, and none of its text or child elements will be transmitted.
      </p>

      <CodeBlock language="html" code={`<!-- This text will be recorded normally -->
<div>
  Welcome back, user!
</div>

<!-- This entire div will be blocked and masked in the replay -->
<div class="rr-block">
  <p>Account Balance: $1,450,000.00</p>
  <p>Routing Number: 123456789</p>
</div>`} />

      <h2 id="masking-text">Masking All Text (Strict Mode)</h2>
      <p>
        If you are operating in a highly regulated environment (like HIPAA compliance in healthcare), you may want to mask <strong>all</strong> text on the page by default, only revealing the structural layout of the application.
      </p>
      <p>
        You can pass the <code>maskAllInputs</code> and <code>maskTextFn</code> configurations when initializing the tracker:
      </p>

      <CodeBlock language="javascript" code={`window.Rewind.init({
  projectToken: 'YOUR_SECURE_PROJECT_TOKEN',
  ingestorUrl: 'wss://ingest.yourdomain.com',
  // Scramble all text characters into asterisks
  maskTextFn: (text) => text.replace(/[a-z0-9]/gi, '*'),
  // Ensure all form inputs are scrambled
  maskAllInputs: true
});`} />

      <h2 id="network-redaction">Network Payload Redaction</h2>
      <p>
        The Rewind Tracker intercepts network requests (both <code>fetch</code> and <code>XHR</code>). While it captures headers and URLs, it <strong>does not</strong> capture the raw POST body payloads by default to prevent capturing API tokens or passwords submitted via forms. If you wish to capture network bodies for debugging, you must explicitly opt-in via the tracker configuration (coming soon).
      </p>

      <h2 id="data-retention">Data Retention & Auto-Deletion</h2>
      <p>
        To comply with GDPR "Right to be Forgotten" and data minimization principles, you should not store session replays indefinitely.
      </p>
      <p>
        Because Rewind stores telemetry natively in PostgreSQL, you can easily implement a rolling deletion policy. We recommend setting up a simple database trigger or a cron job (using the <code>pg_cron</code> extension) to automatically purge sessions older than 30 days:
      </p>
      <CodeBlock language="sql" code={`-- Delete sessions older than 30 days to comply with data minimization
DELETE FROM "Session" 
WHERE "createdAt" < NOW() - INTERVAL '30 days';`} />

      <h2 id="sample-privacy-policy">Sample Privacy Policy Snippet</h2>
      <p>
        If you are using Rewind, transparency is key. You should disclose to your users that you are recording telemetry data. Here is a boilerplate snippet you can adapt and insert into your company's official Privacy Policy:
      </p>

      <div className="p-6 border border-[var(--color-border-dark)] rounded-xl bg-[#050505] text-sm text-neutral-400 italic my-6 leading-relaxed shadow-inner">
        "We use a self-hosted analytics tool (Rewind) to understand how you interact with our website in order to improve our product experience and rapidly identify bugs. This tool records your interactions, such as mouse movements, clicks, network errors, and page navigation. 
        <br/><br/>
        <strong>We strictly do not record sensitive information</strong> (such as passwords or financial data). All telemetry data is stored securely on our own private infrastructure, and it is never sold or shared with third-party advertising or analytics networks."
      </div>
    </>
  );
}
