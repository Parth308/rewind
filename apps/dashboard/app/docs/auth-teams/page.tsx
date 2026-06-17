export const dynamic = 'force-static';

export default function AuthTeamsDocs() {
  return (
    <>
      <h1>Authentication & Team Management</h1>
      
      <p>
        Rewind utilizes a robust, secure, and fully self-hosted authentication system designed to keep your session data absolutely private. Our authentication flow is entirely decoupled from third-party identity providers, ensuring zero external data leakage.
      </p>

      <h2>The Initialization Phase</h2>
      <p>
        When you first deploy Rewind, the database is empty. The platform locks itself into an <strong>Initialization Mode</strong>.
      </p>
      <ul>
        <li>Navigating to the root or dashboard will redirect you to the <code>/setup</code> route.</li>
        <li>Here, you must create the <strong>Owner Account</strong>.</li>
        <li>You will provide your full name, primary email, and a master password.</li>
        <li><strong>Security Note:</strong> Once the Owner Account is created, the <code>/setup</code> route is permanently locked. No further accounts can be created this way, preventing unauthorized takeovers of your instance.</li>
      </ul>

      <h2>Team Invites & Roles</h2>
      <p>
        Rewind supports a multi-user environment. The Owner can invite team members to collaborate on session analysis and debugging.
      </p>

      <h3>Generating an Invite</h3>
      <ol>
        <li>Navigate to <strong>Configuration</strong> &gt; <strong>Team & Roles</strong> in your dashboard.</li>
        <li>Click the <strong>Invite Member</strong> button.</li>
        <li>Enter the exact email address of the person you wish to invite. This email will be cryptographically bound to the invite token.</li>
        <li>Select a role:
          <ul>
            <li><strong>Admin</strong>: Can view sessions, modify project settings, and manage standard users.</li>
            <li><strong>Viewer</strong>: Read-only access to session replays and analytics. Cannot alter system configurations.</li>
          </ul>
        </li>
        <li>Click <strong>Generate Link</strong>. The system will create a secure, one-time-use cryptographic token and provide you with a copyable URL (e.g., <code>https://your-domain.com/invite/a1b2c3...</code>).</li>
      </ol>

      <blockquote>
        <p><strong>Note:</strong> We intentionally use a "Copy Link" architecture rather than SMTP/Email dispatch. This removes the need for you to configure complex SMTP servers or SendGrid APIs during your initial deployment, keeping the self-hosted experience entirely frictionless.</p>
      </blockquote>

      <h3>Accepting an Invite</h3>
      <p>
        When a team member opens the invite link, they are taken to the <strong>Join Workspace</strong> portal.
      </p>
      <ul>
        <li>The system verifies the token's validity against the database.</li>
        <li><strong>Expiration:</strong> All invite tokens automatically expire 48 hours after generation.</li>
        <li>The invited user's email address is pre-filled and locked. They cannot register under a different email than the one you authorized.</li>
        <li>Upon choosing a password and completing the form, the account is created, the invite token is securely burned, and the user is instantly authenticated into the dashboard.</li>
      </ul>

      <h2>Cryptographic Security</h2>
      <p>
        We employ industry-standard cryptographic practices for all identity management:
      </p>
      <ul>
        <li><strong>Password Hashing:</strong> We use <code>bcrypt</code> with a high salt round for all password storage. Plaintext passwords never touch the database.</li>
        <li><strong>Session Management:</strong> Authentication states are maintained via <code>HttpOnly</code>, <code>Secure</code> cookies containing signed JWTs (JSON Web Tokens).</li>
        <li><strong>Route Protection:</strong> Our Next.js Edge Middleware intercepts every request to <code>/dashboard/*</code>, verifying the JWT signature using the <code>JWT_SECRET</code> you define in your <code>.env</code> file. Invalid or expired tokens instantly trigger a redirect to <code>/login</code>.</li>
      </ul>

      <h2>Managing Active Users</h2>
      <p>
        From the <strong>Team & Roles</strong> tab, the Owner can view all active personnel and pending invites.
      </p>
      <ul>
        <li>You can permanently <strong>Remove</strong> an active user. Their session cookie will be invalidated, and they will immediately lose access.</li>
        <li>You can <strong>Revoke</strong> a pending invite before it is used, instantly destroying the token.</li>
      </ul>
    </>
  );
}
