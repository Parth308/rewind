import { Metadata } from 'next';
import { CodeBlock } from '../../../components/docs/code-block';

export const metadata: Metadata = {
  title: 'User Profiles & Tracking - Rewind Docs',
};

export default function UserProfilesPage() {
  return (
    <>
      <h1 id="user-profiles">User Profiles & Tracking</h1>
      
      <p className="text-xl text-neutral-300 mb-8">
        Rewind goes beyond individual session recording by aggregating a user's lifetime behavior. By identifying users, you can view their complete timeline, extract custom attributes, and generate AI-powered Customer Support Briefs.
      </p>

      <h2 id="identifying-users">Identifying Users</h2>
      <p>
        To track a specific user across multiple sessions and devices, you can explicitly identify them using the Rewind SDK. We recommend calling this function as soon as the user successfully logs into your application.
      </p>

      <CodeBlock language="javascript" code={`// After user logs in
window.Rewind.identify("user_12345", {
  plan: "pro",
  email: "john@example.com",
  role: "admin"
});`} />

      <p>
        <strong>Anonymous Users:</strong> If you don't explicitly call <code>identify</code>, the Rewind tracker will automatically generate and persist a permanent anonymous UUID in <code>localStorage</code>. This ensures that unauthenticated users can still be tracked seamlessly across multiple sessions.
      </p>

      <h2 id="the-user-profile">The User Profile CRM</h2>
      <p>
        Once users are tracked, their <code>userId</code> will appear in the <strong>Semantic Search</strong> results. Clicking on a User ID badge will direct you to their dedicated User Profile page.
      </p>
      
      <p>The User Profile page acts as a lightweight CRM, aggregating:</p>
      <ul>
        <li><strong>Lifetime Stats:</strong> First seen date, total time spent, total errors encountered, and total rage clicks.</li>
        <li><strong>Known Attributes:</strong> A merged grid of all custom metadata passed via the <code>identify</code> call.</li>
        <li><strong>Session Timeline:</strong> A chronological timeline of every session the user has ever had, including environment details (OS/Browser) and quick access to replay the session.</li>
      </ul>

      <h2 id="ai-support-briefs">AI Support Briefs</h2>
      <p>
        For users with complex histories, parsing through dozens of sessions can be tedious. Rewind includes an integrated <strong>AI Support Brief</strong> feature natively on the User Profile page.
      </p>
      <p>
        When triggered, the Vercel AI SDK connects to the configured LLM (e.g., Google Gemini 2.5 Flash) and passes the <em>entire narrative history and friction flags</em> of that user. It streams back a highly-analytical, concise markdown report designed to rapidly get support and engineering teams up to speed.
      </p>
      <ul>
        <li><strong>Zero Buffering:</strong> The response is streamed dynamically via Next.js and immediately rendered using Tailwind Typography.</li>
        <li><strong>Friction Detection:</strong> The AI is explicitly instructed to highlight recurring errors, rage clicks, blocked intents, and anything "fishy" about the user's behavior.</li>
      </ul>
    </>
  );
}
