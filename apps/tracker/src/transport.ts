import { RewindConfig } from './config';

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

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    } else {
      // fallback for environments without sendBeacon
      this.send(payload);
    }
  }

  public send(payload: any) {
    payload.sessionId = this.sessionId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.queue.push(payload);
      if (!this.isConnecting) {
        this.connect();
      }
      // If queue gets too large, drop oldest
      if (this.queue.length > 50) {
        this.queue.shift();
      }
      this.sendHttpFallback(payload);
    }
  }

  private flushQueue() {
    while (this.queue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = this.queue.shift();
      this.ws.send(JSON.stringify(payload));
    }
  }

  private async sendHttpFallback(payload: any) {
    let endpoint = this.config.endpoint;
    if (!endpoint.endsWith('/')) endpoint += '/';
    endpoint += this.config.token;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      // Remove from queue if successful
      const idx = this.queue.indexOf(payload);
      if (idx !== -1) {
        this.queue.splice(idx, 1);
      }
    } catch (e) {
      // Failed HTTP as well
    }
  }
}
