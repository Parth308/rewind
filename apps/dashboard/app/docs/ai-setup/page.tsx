import { Metadata } from 'next';
import { CodeBlock } from '../../../components/docs/code-block';

export const metadata: Metadata = {
  title: 'AI Setup - Rewind Docs',
};

export default function AISetupPage() {
  return (
    <>
      <h1 id="ai-setup">AI Configuration & Mechanics</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Rewind deeply integrates the Vercel AI SDK (<code>@ai-sdk/google</code>, <code>@ai-sdk/openai</code>, <code>@ai-sdk/anthropic</code>) to process unstructured telemetry data into actionable semantic insights.
      </p>

      <h2 id="supported-providers">Supported LLM Providers</h2>
      <p>
        The architecture abstracts the Language Models allowing you to seamlessly hot-swap providers via environment variables in your <code>.env</code> file. The fallback resolution logic (handled in <code>packages/shared/src/ai.ts</code>) guarantees a default operational model even if specific parameters are omitted.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <div className="p-6 border border-[var(--color-border-dark)] rounded-xl bg-white/[0.02]">
          <h3 className="text-white font-sans text-lg mb-2 mt-0">Google (Default)</h3>
          <p className="text-sm text-neutral-400 mb-4">Optimized for vast context windows.</p>
          <ul className="text-xs font-mono text-neutral-500 space-y-1 mb-0 pb-0">
            <li><span className="text-[var(--color-accent-green)]">LLM:</span> gemini-2.5-flash</li>
            <li><span className="text-[var(--color-accent-green)]">Embed:</span> gemini-embedding-001</li>
          </ul>
        </div>
        <div className="p-6 border border-[var(--color-border-dark)] rounded-xl bg-white/[0.02]">
          <h3 className="text-white font-sans text-lg mb-2 mt-0">OpenAI</h3>
          <p className="text-sm text-neutral-400 mb-4">Highly consistent JSON instruction following.</p>
          <ul className="text-xs font-mono text-neutral-500 space-y-1 mb-0 pb-0">
            <li><span className="text-[var(--color-accent-green)]">LLM:</span> gpt-4o-mini</li>
            <li><span className="text-[var(--color-accent-green)]">Embed:</span> text-embedding-3-small</li>
          </ul>
        </div>
        <div className="p-6 border border-[var(--color-border-dark)] rounded-xl bg-white/[0.02]">
          <h3 className="text-white font-sans text-lg mb-2 mt-0">Anthropic</h3>
          <p className="text-sm text-neutral-400 mb-4">Superior reasoning and nuance.</p>
          <ul className="text-xs font-mono text-neutral-500 space-y-1 mb-0 pb-0">
            <li><span className="text-[var(--color-accent-green)]">LLM:</span> claude-3-5-sonnet-20240620</li>
            <li><span className="text-[var(--color-accent-green)]">Embed:</span> N/A (Requires Fallback)</li>
          </ul>
        </div>
      </div>

      <h2 id="environment-variables">Environment Configuration</h2>
      <p>Configure the <code>AI_PROVIDER</code> to explicitly route requests to your desired API key. If omitted, the system falls back to Google.</p>

      <CodeBlock language=".env" code={`# Provider Selection (google | openai | anthropic)
AI_PROVIDER=google

# Required API Keys based on selection
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key`} />

      <h2 id="dashboard-configuration">UI & Model Selection</h2>
      <p>
        While you can set the default API keys in your <code>.env</code> file, you can also configure your AI models dynamically through the Dashboard.
      </p>
      <p>
        Navigate to <strong>Settings &gt; API Keys</strong> in the dashboard. From there, you can:
      </p>
      <ul>
        <li>Select your active provider (Google, OpenAI, Anthropic).</li>
        <li>Input a custom API key to override the environment variable.</li>
        <li>Fetch a live list of available models directly from the provider's API.</li>
        <li>Explicitly select exactly which <strong>Language Model</strong> you want for session summaries, and which <strong>Embedding Model</strong> you want for semantic search.</li>
      </ul>
      <p>
        This allows you to easily switch between cheaper, faster models (like <code>gpt-4o-mini</code>) and more powerful reasoning models (like <code>claude-3-5-sonnet</code>) without restarting your Docker containers.
      </p>

      <h2 id="session-summarization">The Summarization Engine</h2>
      <p>
        The core of the AI integration is the <code>summarizeSession</code> function. We do not pass raw video files to the AI; instead, we pass the serialized <code>rrweb</code> DOM mutations, captured network errors, and console logs. 
      </p>
      
      <p>The system prompt specifically instructs the model to act as a <strong>User Behavior Analyst</strong>. It forces the LLM to output highly descriptive, verbose narratives detailing friction, intent, and exact URLs navigated. For example, instead of "User clicked a button", the AI outputs "The user repeatedly rage-clicked the Submit Order button on /checkout after receiving a 500 Network Error, indicating high frustration."</p>

      <CodeBlock language="typescript" code={`export async function summarizeSession(eventsJson, networkJson, consoleJson) {
  const systemPrompt = \`
    You are an expert user behavior analyst. Read the telemetry data...
    CRITICAL INSTRUCTIONS:
    - Explicitly describe any friction, errors, or frustration signals.
    - Deduce their intent based on their actions.
  \`;
  // Passes context to the selected Vercel AI SDK provider
  return await generateText({ ... });
}`} />

      <h2 id="semantic-search">Vector Embeddings for Semantic Search</h2>
      <p>
        Once the <code>summarizeSession</code> function generates the human-readable narrative of the user's session, that text string is immediately passed into the <code>generateSessionEmbedding</code> function.
      </p>
      <p>
        The text is converted into a high-dimensional vector array (using models like <code>text-embedding-3-small</code>). This array is then stored in the PostgreSQL database alongside the session record using the <code>pgvector</code> extension. When you search your sessions in the Dashboard, your query is similarly embedded, allowing mathematical cosine-similarity matching to find sessions conceptually related to your query, rather than relying on exact keyword matches.
      </p>
    </>
  );
}
