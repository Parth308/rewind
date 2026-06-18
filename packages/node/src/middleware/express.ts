import { Rewind } from '../client';

/**
 * Express middleware that automatically associates incoming requests with a Rewind session.
 * It extracts the `x-rewind-session-id` header (if present) and attaches a `rewind` object to the request.
 */
export function expressMiddleware(rewindClient: Rewind) {
  return (req: any, res: any, next: any) => {
    const sessionId = req.headers['x-rewind-session-id'] as string | undefined;
    
    req.rewind = {
      sessionId,
      track: async (eventName: string, payload?: Record<string, any>) => {
        if (sessionId) await rewindClient.track(sessionId, eventName, payload);
        else console.warn('[Rewind] req.rewind.track() called but no x-rewind-session-id header was found.');
      },
      identify: async (userId: string, metadata?: Record<string, any>) => {
        if (sessionId) await rewindClient.identify(sessionId, userId, metadata);
        else console.warn('[Rewind] req.rewind.identify() called but no x-rewind-session-id header was found.');
      },
      captureException: async (error: Error | unknown, context?: Record<string, any>) => {
        if (sessionId) await rewindClient.captureException(sessionId, error, context);
        else console.warn('[Rewind] req.rewind.captureException() called but no x-rewind-session-id header was found.');
      }
    };
    
    next();
  };
}
