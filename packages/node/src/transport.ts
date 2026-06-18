export class Transport {
  private projectToken: string;
  private ingestorUrl: string;

  constructor(projectToken: string, ingestorUrl: string) {
    this.projectToken = projectToken;
    this.ingestorUrl = ingestorUrl;
  }

  public async sendToIngestor(payload: any, logTag: string): Promise<void> {
    const endpoint = `${this.ingestorUrl.replace(/\/$/, '')}/ingest/${this.projectToken}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Rewind] Failed to send ${logTag} to ingestor. Status: ${response.status}. Msg: ${errorText}`);
      }
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        console.warn(`[Rewind] Event dropped. Ingestor timeout after 5000ms ("${logTag}").`);
      } else {
        console.error(`[Rewind] Error pushing ${logTag}:`, error.message || error);
      }
    }
  }
}
