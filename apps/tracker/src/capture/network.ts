import { Transport } from '../transport';
import { RewindConfig } from '../config';

function maskNetworkBody(bodyStr: string, maskKeys: string[]): string {
  if (!maskKeys || maskKeys.length === 0 || !bodyStr) return bodyStr;
  try {
    const parsed = JSON.parse(bodyStr);
    const maskRecursive = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        if (maskKeys.includes(key)) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          maskRecursive(obj[key]);
        }
      }
    };
    maskRecursive(parsed);
    return JSON.stringify(parsed);
  } catch {
    return bodyStr;
  }
}

export function setupNetworkCapture(transport: Transport, config: RewindConfig) {
  // Fetch interceptor
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const startTime = Date.now();
    const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
    const method = (args[1]?.method || 'GET').toUpperCase();

    // Ignore tracker urls and ignored urls
    if (requestUrl.includes(config.endpoint) || config.ignoreUrls.some(u => requestUrl.includes(u))) {
      return originalFetch.apply(this, args);
    }

    let requestBody: string | undefined = undefined;
    if (config.captureNetworkBodies && args[1]?.body && typeof args[1].body === 'string') {
      requestBody = maskNetworkBody(args[1].body, config.networkBodyMaskKeys);
    }

    try {
      const response = await originalFetch.apply(this, args);
      const duration = Date.now() - startTime;
      
      let responseBody: string | undefined = undefined;
      if (config.captureNetworkBodies) {
        try {
          const cloned = response.clone();
          const text = await cloned.text();
          responseBody = maskNetworkBody(text, config.networkBodyMaskKeys);
        } catch (e) {
          // Ignore clone/text errors
        }
      }

      transport.send({
        type: 'network',
        requests: [{
          url: requestUrl,
          method,
          status: response.status,
          duration,
          timestamp: startTime,
          requestBody,
          responseBody
        } as any] // Cast as any because the types in tracker might not have requestBody yet
      });

      return response;
    } catch (err) {
      const duration = Date.now() - startTime;
      transport.send({
        type: 'network',
        requests: [{
          url: requestUrl,
          method,
          status: 0,
          duration,
          timestamp: startTime,
          requestBody
        } as any]
      });
      throw err;
    }
  };
}
