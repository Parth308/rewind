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
        The Rewind Tracker intercepts network requests. While it captures URLs, methods, and latency, it <strong>does not</strong> capture the raw API payloads (like POST bodies or response data) by default, preventing the accidental capture of API tokens or passwords submitted via forms.
      </p>
      <p>
        You can explicitly opt-in to capture API request and response bodies from the <strong>Privacy & Masking</strong> dashboard using the <em>Capture API Payloads</em> toggle. When enabled, you can also define a list of <strong>Redacted JSON Keys</strong> (e.g., <code>password, token, credit_card</code>). The tracker will automatically scrub these specific keys from any JSON payloads directly in the browser, replacing their values with <code>[REDACTED]</code> before they are ever transmitted to your server.
      </p>

      <h2 id="data-retention">Data Retention & Auto-Deletion</h2>
      <p>
        To comply with GDPR "Right to be Forgotten" and data minimization principles, you should not store session replays indefinitely.
      </p>
      <p>
        Because Rewind stores telemetry natively in PostgreSQL, you can easily implement a rolling deletion policy. We recommend setting up a cron job (using the <code>pg_cron</code> extension) directly inside your database to automatically purge sessions older than 30 days.
      </p>
      
      <h3>Setting up the Automated Cleanup Job</h3>
      <p>You can execute the following SQL script using any database GUI (like DBeaver or DataGrip), or by connecting to your production Postgres Docker container via the terminal:</p>
      
      <CodeBlock language="bash" code={`# Connect to the running Postgres container
docker exec -it rewind-postgres psql -U postgres -d rewind`} />

      <p className="mt-4">Once connected, run the following SQL to schedule a daily cleanup job at midnight:</p>

      <CodeBlock language="sql" code={`-- 1. Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule a daily job to delete sessions older than 30 days
SELECT cron.schedule('daily-session-cleanup', '0 0 * * *', $$
  DELETE FROM "sessions" 
  WHERE "created_at" < NOW() - INTERVAL '30 days';
$$);`} />

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
