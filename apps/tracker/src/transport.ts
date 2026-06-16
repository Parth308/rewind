import { RewindConfig } from './config';
import * as fflate from 'fflate';

export class Transport {
  private config: RewindConfig;
  private ws: WebSocket | null = null;
  private sessionId: string;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private isConnecting = false;
  private queue: any[] = [];

  constructor(config: RewindConfig, sessionId: string) {
    this.config = config;
    this.sessionId = sessionId;
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) return;
    this.isConnecting = true;

    // Convert http(s) endpoint to ws(s)
    let wsEndpoint = this.config.endpoint.replace(/^http/, 'ws');
    if (!wsEndpoint.endsWith('/')) wsEndpoint += '/';
    wsEndpoint += this.config.token;

    try {
      this.ws = new WebSocket(wsEndpoint);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.flushQueue();
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        this.isConnecting = false;
        console.warn('Rewind tracker: WebSocket error', err);
      };
    } catch (e) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }

  // Called by Recorder on beforeunload — uses sendBeacon which the browser
  // guarantees to complete even as the page is tearing down.
  public beaconFlush(payload: any) {
    payload.sessionId = this.sessionId;
    let endpoint = this.config.endpoint;
    if (!endpoint.endsWith('/')) endpoint += '/';
    endpoint += this.config.token;

    const jsonStr = JSON.stringify(payload);
    const compressed = fflate.gzipSync(fflate.strToU8(jsonStr));

    if (navigator.sendBeacon) {
      const blob = new Blob([compressed as any], { type: 'application/octet-stream' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      // fallback for environments without sendBeacon
      this.send(payload);
    }
  }

  public send(payload: any) {
    payload.sessionId = this.sessionId;
    const jsonStr = JSON.stringify(payload);
    const compressed = fflate.gzipSync(fflate.strToU8(jsonStr));

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(compressed);
    } else {
      this.queue.push(payload);
      if (!this.isConnecting) {
        this.connect();
      }
      // If queue gets too large, drop oldest
      if (this.queue.length > 50) {
        this.queue.shift();
      }
      this.sendHttpFallback(compressed);
    }
  }

  private flushQueue() {
    while (this.queue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = this.queue.shift();
      const jsonStr = JSON.stringify(payload);
      const compressed = fflate.gzipSync(fflate.strToU8(jsonStr));
      this.ws.send(compressed);
    }
  }

  private async sendHttpFallback(compressed: Uint8Array) {
    let endpoint = this.config.endpoint;
    if (!endpoint.endsWith('/')) endpoint += '/';
    endpoint += this.config.token;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: new Blob([compressed as any], { type: 'application/octet-stream' }),
        keepalive: true,
      });
      // We don't remove from queue here anymore, it's a bit tricky because the queue stores uncompressed payloads.
      // But we can just clear it if we want, or leave it to be flushed via WS when reconnected.
      // Assuming if HTTP succeeded, we should clear the queue.
      this.queue.length = 0; // simple fix to avoid duplicate sending if HTTP actually works
    } catch (e) {
      // Failed HTTP as well
    }
  }
}
