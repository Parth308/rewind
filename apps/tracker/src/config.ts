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
  const localRaw = overrideRaw || w.__rewind || {};
  const remoteRaw = w.__rewind_remote || {};
  
  const token = localRaw.token || localRaw.projectToken || remoteRaw.token || remoteRaw.projectToken;
  if (!token) {
    console.error('Rewind tracker: Project token is missing.');
    return null;
  }

  // Local settings override remote boolean/scalar settings, arrays are merged
  const maskInputs = localRaw.maskInputs !== undefined 
    ? localRaw.maskInputs 
    : (remoteRaw.maskInputs !== undefined ? remoteRaw.maskInputs : true);

  const maskSelectors = [...new Set([...(remoteRaw.maskSelectors || []), ...(localRaw.maskSelectors || [])])];
  const blockSelectors = [...new Set([...(remoteRaw.blockSelectors || []), ...(localRaw.blockSelectors || [])])];
  const ignoreUrls = [...new Set([...(remoteRaw.ignoreUrls || []), ...(localRaw.ignoreUrls || [])])];

  return {
    token,
    maskInputs,
    maskSelectors,
    blockSelectors,
    ignoreUrls,
    userId: localRaw.userId || null,
    metadata: { ...(remoteRaw.metadata || {}), ...(localRaw.metadata || {}) },
    bufferSize: localRaw.bufferSize || remoteRaw.bufferSize || 50,
    endpoint: localRaw.endpoint || localRaw.ingestorUrl || remoteRaw.endpoint || remoteRaw.ingestorUrl || DEFAULT_ENDPOINT,
  };
}
