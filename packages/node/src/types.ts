export interface RewindOptions {
  /**
   * Your project's unique ingestion token.
   */
  projectToken: string;

  /**
   * The base URL for the Ingestor.
   * Defaults to 'http://localhost:3001' for local development.
   * In production, this should be 'https://ingest.yourdomain.com'.
   */
  ingestorUrl?: string;
}

export interface RewindRequest {
  rewind: {
    sessionId?: string;
    track: (eventName: string, payload?: Record<string, any>) => Promise<void>;
    identify: (userId: string, metadata?: Record<string, any>) => Promise<void>;
    captureException: (error: Error | unknown, context?: Record<string, any>) => Promise<void>;
  };
}
