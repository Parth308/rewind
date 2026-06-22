import { cookies } from 'next/headers';
import SearchClient from './search-client';
import { performSemanticSearch } from '@/lib/search-data';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const cookieStore = await cookies();
  const projectId = cookieStore.get('rewind_active_project')?.value || 'all';
  const resolvedSearchParams = await searchParams;
  const q = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : '';
  const page = Number(resolvedSearchParams.page) || 1;

  let initialResults: any[] = [];
  let initialSearchType: string | null = null;
  let totalCount = 0;
  
  if (q.trim()) {
    try {
      const data = await performSemanticSearch(q, projectId, page, 20);
      initialResults = data.results;
      initialSearchType = data.searchType;
      totalCount = data.totalCount;
    } catch (e) {
      console.error(e);
      initialSearchType = 'error';
    }
  }

  return (
    <SearchClient 
      projectId={projectId} 
      initialQuery={q} 
      initialResults={initialResults} 
      initialSearchType={initialSearchType} 
      totalCount={totalCount}
    />
  );
}
