import { cookies } from 'next/headers';
import SearchClient from './search-client';

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  const cookieStore = await cookies();
  const projectId = cookieStore.get('rewind_active_project')?.value || 'all';

  return <SearchClient projectId={projectId} />;
}
