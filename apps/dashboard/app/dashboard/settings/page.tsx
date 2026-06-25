import { SettingsView } from './SettingsView';
import { db } from '@/lib/db';
import { users, invites, projects } from '@rewind/shared';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const userResult = await db.select().from(users).where(eq(users.id, session.userId as string));
  const user = userResult[0];

  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
  }).from(users);

  const pendingInvites = await db.select().from(invites);

  const cookieStore = await cookies();
  const projectId = cookieStore.get('rewind_active_project')?.value;

  let initialPrivacySettings = {
    maskInputs: true,
    maskSelectors: [],
    blockSelectors: [],
    ignoreUrls: [],
    captureNetworkBodies: false,
    networkBodyMaskKeys: [],
  };

  let projectSettings = {};
  if (projectId && projectId !== 'all') {
    const activeProject = await db.select().from(projects).where(eq(projects.id, projectId));
    if (activeProject.length > 0) {
      projectSettings = activeProject[0].settings || {};
      const ps = projectSettings as any;
      initialPrivacySettings = {
        maskInputs: ps.maskInputs !== undefined ? ps.maskInputs : true,
        maskSelectors: ps.maskSelectors || [],
        blockSelectors: ps.blockSelectors || [],
        ignoreUrls: ps.ignoreUrls || [],
        captureNetworkBodies: ps.captureNetworkBodies || false,
        networkBodyMaskKeys: ps.networkBodyMaskKeys || [],
      };
    }
  }

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const userSettings = user?.settings || {};

  if (isDemoMode) {
    if ((userSettings as any)?.ai?.googleApiKey) (userSettings as any).ai.googleApiKey = 'AIzaSy...[HIDDEN_IN_DEMO]';
    if ((userSettings as any)?.ai?.openaiApiKey) (userSettings as any).ai.openaiApiKey = 'sk-...[HIDDEN_IN_DEMO]';
    if ((userSettings as any)?.ai?.anthropicApiKey) (userSettings as any).ai.anthropicApiKey = 'sk-ant-...[HIDDEN_IN_DEMO]';
    
    if ((projectSettings as any)?.ai?.googleApiKey) (projectSettings as any).ai.googleApiKey = 'AIzaSy...[HIDDEN_IN_DEMO]';
    if ((projectSettings as any)?.ai?.openaiApiKey) (projectSettings as any).ai.openaiApiKey = 'sk-...[HIDDEN_IN_DEMO]';
    if ((projectSettings as any)?.ai?.anthropicApiKey) (projectSettings as any).ai.anthropicApiKey = 'sk-ant-...[HIDDEN_IN_DEMO]';
  }

  const envSettings = {
    provider: process.env.AI_PROVIDER || 'google',
    googleApiKey: '', 
    openaiApiKey: '',
    anthropicApiKey: '',
    languageModel: process.env.AI_PROVIDER === 'openai' ? 'gpt-4o-mini' : process.env.AI_PROVIDER === 'anthropic' ? 'claude-3-5-sonnet-20240620' : 'gemini-2.5-flash',
    embeddingModel: process.env.AI_PROVIDER === 'openai' ? 'text-embedding-3-small' : 'gemini-embedding-001',
  };

  const initialAiSettings = {
    ...envSettings,
    ...(userSettings as any)?.ai,
    ...(projectSettings as any)?.ai,
  };
  
  const envStatus = {
    hasGoogleKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    hasOpenAiKey: !!process.env.OPENAI_API_KEY,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
  };

  return (
    <SettingsView 
      initialName={user?.name || 'Admin User'} 
      initialEmail={user?.email || 'admin@rewind.dev'} 
      users={allUsers}
      invites={pendingInvites}
      currentUserRole={session.role as string}
      initialPrivacySettings={initialPrivacySettings}
      initialAiSettings={{ settings: initialAiSettings, env: envStatus }}
      isDemoMode={isDemoMode}
    />
  );
}
