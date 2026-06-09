import { cookies } from 'next/headers';
import FunnelsClient from './funnels-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Funnels - Rewind',
};

export default async function FunnelsPage() {
  const cookieStore = await cookies();
  const projectId = cookieStore.get('rewind_active_project')?.value || 'all';

  return <FunnelsClient projectId={projectId} />;
}
