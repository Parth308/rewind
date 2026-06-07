import { Metadata } from 'next';
import { CodeBlock } from '../../../components/docs/code-block';

export const metadata: Metadata = {
  title: 'API Reference - Rewind Docs',
};

export default function ApiReferencePage() {
  return (
    <>
      <h1 id="api-reference">REST API Reference</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Rewind exposes a REST API (Port 3002) allowing you to programmatically fetch session data, trigger AI summaries, and integrate session links into your internal tools.
      </p>

      <h2 id="authentication">Authentication</h2>
      <p>
        All API requests must be authenticated using a JWT (JSON Web Token) issued by the dashboard. You must include this token in the <code>Authorization</code> header of your requests.
      </p>

      <CodeBlock language="http" code={`GET /api/sessions HTTP/1.1
Host: api.yourdomain.com
Authorization: Bearer YOUR_JWT_TOKEN`} />

      <h2 id="endpoints">Endpoints</h2>

      <h3 id="list-projects">1. List Projects</h3>
      <p>Fetch all projects accessible by the authenticated user.</p>
      
      <div className="p-4 border border-[var(--color-border-dark)] rounded-xl bg-[#050505] my-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 bg-[var(--color-accent-green)] text-black font-mono text-xs font-bold rounded">GET</span>
          <code className="text-neutral-300 text-sm">/api/projects</code>
        </div>
        <p className="text-sm text-neutral-400">Returns an array of project objects.</p>
      </div>

      <h3 id="create-project">2. Create Project</h3>
      <p>Create a new project and generate a tracker token.</p>
      
      <div className="p-4 border border-[var(--color-border-dark)] rounded-xl bg-[#050505] my-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 bg-[#3b82f6] text-white font-mono text-xs font-bold rounded">POST</span>
          <code className="text-neutral-300 text-sm">/api/projects</code>
        </div>
        <p className="text-sm text-neutral-400 mb-2"><strong>Body:</strong></p>
        <CodeBlock language="json" code={`{
  "name": "My New App"
}`} />
      </div>

      <h3 id="list-sessions">3. List Project Sessions</h3>
      <p>Fetch a list of recorded sessions for a specific project.</p>
      
      <div className="p-4 border border-[var(--color-border-dark)] rounded-xl bg-[#050505] my-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 bg-[var(--color-accent-green)] text-black font-mono text-xs font-bold rounded">GET</span>
          <code className="text-neutral-300 text-sm">/api/projects/:projectId/sessions</code>
        </div>
      </div>

      <h3 id="get-session">4. Get Session Metadata</h3>
      <p>Fetch the metadata (duration, browser, os, AI summary) for a specific session.</p>

      <div className="p-4 border border-[var(--color-border-dark)] rounded-xl bg-[#050505] my-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 bg-[var(--color-accent-green)] text-black font-mono text-xs font-bold rounded">GET</span>
          <code className="text-neutral-300 text-sm">/api/sessions/:sessionId</code>
        </div>
      </div>

      <h3 id="get-session-events">5. Get Session Replay Data</h3>
      <p>Fetch the raw <code>rrweb</code> DOM mutation events for a specific session to power custom replay interfaces.</p>

      <div className="p-4 border border-[var(--color-border-dark)] rounded-xl bg-[#050505] my-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 bg-[var(--color-accent-green)] text-black font-mono text-xs font-bold rounded">GET</span>
          <code className="text-neutral-300 text-sm">/api/sessions/:sessionId/events</code>
        </div>
        <p className="text-sm text-neutral-400">Returns a compressed JSON array of standard <code>rrweb</code> event nodes.</p>
      </div>
    </>
  );
}
