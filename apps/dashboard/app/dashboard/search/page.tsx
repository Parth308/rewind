import { db } from '@/lib/db';
import { projects } from '@rewind/shared';
import SearchClient from './search-client';

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  // Get the first project (assuming single project workspace for now)
  const allProjects = await db.select().from(projects).limit(1);
  const projectId = allProjects.length > 0 ? allProjects[0].id : null;

  return <SearchClient projectId={projectId} />;
}
