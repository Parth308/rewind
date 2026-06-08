import { Metadata } from 'next';
import { DeploymentPipeline } from '../../../components/marketing/deployment-pipeline';
import { CodeBlock } from '../../../components/docs/code-block';

export const metadata: Metadata = {
  title: 'Installation - Rewind Docs',
};

export default function InstallationPage() {
  return (
    <>
      <h1 id="installation">Deployment & Setup</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Rewind provides exhaustive Docker configurations allowing you to seamlessly transition from local development on your machine to a production VPS deployment.
      </p>

      <h2 id="environment-variables">Exhaustive Environment Configuration</h2>
      <p>Before launching, you must configure your <code>.env</code> file. Copy the block below to your <code>.env</code> file and configure the secrets:</p>
      
      <CodeBlock language=".env" code={`# Database Configuration
# Use host "postgres" for Docker prod, or "localhost" for local dev
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/rewind

# Queue Configuration 
# Use host "redis" for Docker prod, or "localhost" for local dev
REDIS_URL=redis://localhost:6379

# Authentication
# Must be a secure random string in production
JWT_SECRET=dev_secret_key

# Service URLs
FRONTEND_URL=http://localhost:3000
API_URL=http://api:3002
TRACKER_INGESTOR_URL=ws://localhost:3001`} />

      <div className="my-12 w-full overflow-hidden border border-[var(--color-border-dark)] rounded-2xl bg-[#050505]">
        <DeploymentPipeline />
      </div>

      <h2 id="production-deployment">Production VPS Deployment</h2>
      <p>To deploy to a production environment (like a DigitalOcean Droplet, AWS EC2, or Hetzner VPS), you rely entirely on the provided multi-stage Dockerfile.</p>

      <p>The build pipeline uses <code>pnpm fetch</code> and <code>pnpm install --offline</code> to maximize layer caching. Before the final runner image is constructed, it executes <code>pnpm prune --prod</code>. This aggressively strips out development dependencies (like TypeScript compilers, ESLint, and Next.js dev servers) to produce incredibly lean production containers.</p>

      <CodeBlock language="bash" code={`# 1. Clone the repo on your VPS
git clone https://github.com/Parth308/rewind.git
cd rewind

# 2. Configure environment (Map URLs to internal docker networks)
cp .env.example .env

# 3. Build aggressive production images and detach
docker compose -f docker-compose.prod.yml up --build -d

# 4. Push the database schema via the API container
docker compose -f docker-compose.prod.yml exec api pnpm run db:push`} />

      <h2 id="local-development">Local Development Environment</h2>
      <p>If you are actively modifying code, use the local configuration to benefit from Next.js Hot Module Replacement (HMR).</p>
      
      <CodeBlock language="bash" code={`# 1. Install workspace dependencies
pnpm install

# 2. Start ONLY the databases (Postgres on 5433, Redis on 6379)
docker compose up -d

# 3. Apply schema migrations
pnpm run db:push

# 4. Bundle the client-side tracker payload
cd apps/tracker && pnpm install && pnpm run build && cd ../..

# 5. Boot the Turborepo graph (starts Dashboard, API, Worker, Ingestor)
pnpm run dev`} />

      <h2 id="next-steps">Next Steps</h2>
      <p>Now that your containers are running, you should configure your system:</p>
      <ul>
        <li>Review the <a href="/docs/scaling" className="text-[var(--color-accent-green)] hover:underline">Hardware & Scaling</a> requirements to ensure your database won't crash under load.</li>
        <li>Configure your AI Provider keys (Google Gemini, OpenAI, Anthropic) by checking out the <a href="/docs/ai-setup" className="text-[var(--color-accent-green)] hover:underline">AI Setup & Configuration</a> guide to unlock session summarization.</li>
      </ul>

      <h2 id="user-identification">User Identification (Recommended)</h2>
      <p>To get the best insights, including the AI Support Briefs and the User CRM features, you should identify your users after they log in. You can typically do this by fetching the <code>/me</code> endpoint of your own backend and passing the result to the tracker:</p>
      
      <CodeBlock language="javascript" code={`// Example: Fetch user data from your own backend and pass it to Rewind
fetch('/api/me')
  .then(res => res.json())
  .then(user => {
    if (user && user.id) {
      window.Rewind.identify(user.id, {
        email: user.email,
        plan: user.plan,
        role: user.role
      });
    }
  })
  .catch(err => console.error('Failed to identify user', err));`} />
    </>
  );
}
