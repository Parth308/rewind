import { NextRequest, NextResponse } from 'next/server';
import { performSemanticSearch } from '@/lib/search-data';

export async function POST(req: NextRequest) {
  try {
    const { query, projectId, page = 1, limit = 20 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const { results, searchType, totalCount } = await performSemanticSearch(query, projectId, page, limit);
    return NextResponse.json({ success: true, results, searchType, totalCount });
  } catch (error) {
    console.error('[Search] Error executing search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
