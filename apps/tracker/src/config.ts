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

export function getConfig(overrideRaw?: any): RewindConfig | null {
  const w = window as any;
  const raw = overrideRaw || w.__rewind;
  
  if (!raw || (!raw.token && !raw.projectToken)) {
    console.error('Rewind tracker: Project token is missing.');
    return null;
  }

  return {
    token: raw.token || raw.projectToken,
    maskInputs: raw.maskInputs !== undefined ? raw.maskInputs : true,
    maskSelectors: raw.maskSelectors || [],
    blockSelectors: raw.blockSelectors || [],
    ignoreUrls: raw.ignoreUrls || [],
    userId: raw.userId || null,
    metadata: raw.metadata || {},
    bufferSize: raw.bufferSize || 50,
    endpoint: raw.endpoint || raw.ingestorUrl || DEFAULT_ENDPOINT,
  };
}
