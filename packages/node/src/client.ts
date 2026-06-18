import { RewindOptions } from './types';
import { Transport } from './transport';
import { expressMiddleware } from './middleware/express';

export class Rewind {
  private transport: Transport;

  constructor(options: RewindOptions) {
    if (!options.projectToken) {
      throw new Error('[Rewind] projectToken is required');
    }
    const ingestorUrl = options.ingestorUrl || 'http://localhost:3001';
    this.transport = new Transport(options.projectToken, ingestorUrl);
  }

  /**
   * Pushes a custom business event directly onto a user's active session replay timeline.
   * 
   * @param sessionId The active frontend session ID. Retrieve this on the client via `window.Rewind.sessionId` and send it to your backend.
   * @param eventName A descriptive name for the event (e.g. "Payment Processed").
   * @param payload Optional key-value context for the event (e.g. { amount: 100, currency: "USD" }).
   */
  public async track(sessionId: string, eventName: string, payload?: Record<string, any>): Promise<void> {
    if (!sessionId) {
      console.warn('[Rewind] track() called without a sessionId. Event dropped.');
      return;
    }

    const customEvent = {
      type: 5, // rrweb Custom Event type
      timestamp: Date.now(),
      data: {
        tag: eventName,
        payload: payload || {}
      }
    };

    const batchPayload = {
      type: 'batch',
      sessionId,
      events: [customEvent]
    };

    await this.transport.sendToIngestor(batchPayload, `custom event "${eventName}"`);
  }

  /**
   * Identifies a user in the active session replay timeline.
   * 
   * @param sessionId The active frontend session ID.
   * @param userId The unique user identifier (e.g. database ID, email).
   * @param metadata Optional key-value metadata about the user.
   */
  public async identify(sessionId: string, userId: string, metadata?: Record<string, any>): Promise<void> {
    if (!sessionId || !userId) {
      console.warn('[Rewind] identify() called without a sessionId or userId. Event dropped.');
      return;
    }

    const payload = {
      type: 'identify',
      sessionId,
      userId,
      metadata: metadata || {}
    };

    await this.transport.sendToIngestor(payload, 'identify');
  }

  /**
   * Captures a server-side exception and attaches it to the frontend session timeline.
   * 
   * @param sessionId The active frontend session ID.
   * @param error The error object.
   * @param context Optional context to include in the error message.
   */
  public async captureException(sessionId: string, error: Error | unknown, context?: Record<string, any>): Promise<void> {
    if (!sessionId) {
      console.warn('[Rewind] captureException() called without a sessionId. Event dropped.');
      return;
    }

    let errorMessage = 'Unknown Error';
    if (error instanceof Error) {
      errorMessage = error.stack || error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }

    if (context) {
      errorMessage += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }

    const payload = {
      type: 'console',
      sessionId,
      entries: [{
        level: 'error',
        message: [errorMessage], // Send as array of strings, similar to console.log args
        timestamp: Date.now()
      }]
    };

    await this.transport.sendToIngestor(payload, 'exception');
  }

  /**
   * Express middleware that automatically associates incoming requests with a Rewind session.
   * It extracts the `x-rewind-session-id` header (if present) and attaches a `rewind` object to the request.
   */
  public expressMiddleware() {
    return expressMiddleware(this);
  }
}
