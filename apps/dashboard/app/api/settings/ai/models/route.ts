import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ModelInfo {
  id: string;
  name: string;
  supportsEmbedding: boolean;
  supportsGeneration: boolean;
  contextWindow?: number;
}

async function fetchGoogleModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`Google API error: ${res.statusText}`);
  const data = await res.json();

  return (data.models || [])
    .filter((m: any) => {
      const methods: string[] = m.supportedGenerationMethods || [];
      return methods.includes('generateContent') || methods.includes('embedContent');
    })
    .map((m: any) => ({
      id: m.name.replace('models/', ''),
      name: m.displayName || m.name.replace('models/', ''),
      supportsEmbedding: (m.supportedGenerationMethods || []).includes('embedContent'),
      supportsGeneration: (m.supportedGenerationMethods || []).includes('generateContent'),
      contextWindow: m.inputTokenLimit,
    }));
}

async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.statusText}`);
  const data = await res.json();

  const embeddingIds = new Set(['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002']);
  const chatIds = new Set(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o3', 'o4-mini']);

  return (data.data || [])
    .filter((m: any) => embeddingIds.has(m.id) || chatIds.has(m.id) || m.id.startsWith('gpt-') || m.id.startsWith('o') || m.id.startsWith('text-embedding'))
    .map((m: any) => ({
      id: m.id,
      name: m.id,
      supportsEmbedding: embeddingIds.has(m.id) || m.id.includes('embedding'),
      supportsGeneration: !m.id.includes('embedding') && !m.id.includes('tts') && !m.id.includes('whisper') && !m.id.includes('dall-e'),
    }))
    .filter((m: ModelInfo) => m.supportsEmbedding || m.supportsGeneration);
}

async function fetchAnthropicModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.statusText}`);
  const data = await res.json();

  return (data.data || []).map((m: any) => ({
    id: m.id,
    name: m.display_name || m.id,
    supportsEmbedding: false,
    supportsGeneration: true,
    contextWindow: m.context_window,
  }));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const provider = url.searchParams.get('provider');
  const apiKey = url.searchParams.get('apiKey');

  if (!provider || !apiKey) {
    return NextResponse.json({ error: 'provider and apiKey are required' }, { status: 400 });
  }

  try {
    let models: ModelInfo[] = [];

    if (provider === 'google') {
      models = await fetchGoogleModels(apiKey);
    } else if (provider === 'openai') {
      models = await fetchOpenAIModels(apiKey);
    } else if (provider === 'anthropic') {
      models = await fetchAnthropicModels(apiKey);
    } else {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    return NextResponse.json({ success: true, models });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch models' }, { status: 500 });
  }
}
