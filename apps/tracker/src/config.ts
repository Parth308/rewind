export interface RewindConfig {
  token: string;
  maskInputs: boolean;
  maskSelectors: string[];
  blockSelectors: string[];
  ignoreUrls: string[];
  userId: string | null;
  metadata: Record<string, unknown>;
  bufferSize: number;
  endpoint: string;
}

const DEFAULT_ENDPOINT = 'http://localhost:3001/ingest';

export function getConfig(): RewindConfig | null {
  const w = window as any;
  if (!w.__rewind || !w.__rewind.token) {
    console.error('Rewind tracker: Project token is missing. Please set window.__rewind = { token: "YOUR_TOKEN" }');
    return null;
  }

  const raw = w.__rewind;

  return {
    token: raw.token,
    maskInputs: raw.maskInputs !== undefined ? raw.maskInputs : true,
    maskSelectors: raw.maskSelectors || [],
    blockSelectors: raw.blockSelectors || [],
    ignoreUrls: raw.ignoreUrls || [],
    userId: raw.userId || null,
    metadata: raw.metadata || {},
    bufferSize: raw.bufferSize || 50,
    endpoint: raw.endpoint || DEFAULT_ENDPOINT,
  };
}
