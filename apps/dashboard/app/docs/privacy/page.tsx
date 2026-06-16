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

      <h2 id="dashboard-configuration">Privacy & Masking Dashboard</h2>
      <p>
        Rewind provides a centralized <strong>Privacy & Masking</strong> module within your project configuration. You no longer need to hardcode privacy rules into your client application. From the dashboard, you can define:
      </p>
      <ul>
        <li><strong>Mask Input Fields:</strong> A global toggle to automatically scramble all input and textarea fields into asterisks.</li>
        <li><strong>Mask Selectors:</strong> A comma-separated list of CSS selectors (e.g., <code>.private-text, #user-balance</code>). Any text inside these elements will be scrambled, but the layout is preserved.</li>
        <li><strong>Block Selectors:</strong> A comma-separated list of CSS selectors (e.g., <code>.sensitive-image, #checkout-iframe</code>). These elements and all their children are completely hidden from the recording and replaced by a placeholder block.</li>
        <li><strong>Ignore URLs:</strong> A comma-separated list of URL paths or wildcards (e.g., <code>/checkout/*, /admin</code>). If a user navigates to an ignored URL, the tracker instantly pauses recording.</li>
      </ul>

      <h2 id="local-overrides">Local Code Overrides</h2>
      <p>
        If you have highly dynamic pages where selectors aren't sufficient, you can still apply privacy rules directly in your HTML using standard rrweb classes:
      </p>
      <ul>
        <li>Add the <code>rr-block</code> class to completely redact a DOM node.</li>
        <li>Add the <code>rr-mask</code> class to scramble text inside a specific DOM node.</li>
        <li>Add the <code>rr-ignore</code> class to ignore input changes in specific form fields.</li>
      </ul>

      <CodeBlock language="html" code={`<div>
  Welcome back, user!
</div>

<!-- This entire div will be blocked and masked in the replay -->
<div class="rr-block">
  <p>Account Balance: $1,450,000.00</p>
  <p>Routing Number: 123456789</p>
</div>`} />

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
