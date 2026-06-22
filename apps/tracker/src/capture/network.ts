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

function extractBodyStr(body: any): string | undefined {
  if (!body) return undefined;
  if (typeof body === 'string') return body;
  if (body instanceof FormData || body instanceof URLSearchParams) {
    try {
      const entries: any = {};
      (body as any).forEach((value: any, key: string) => { entries[key] = value; });
      return JSON.stringify(entries);
    } catch { }
  }
  return undefined;
}

export function setupNetworkCapture(transport: Transport, config: RewindConfig) {
  // 1. Fetch interceptor
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const startTime = Date.now();
    let requestUrl = '';
    if (typeof args[0] === 'string') requestUrl = args[0];
    else if (args[0] instanceof URL) requestUrl = args[0].href;
    else if (args[0] && typeof (args[0] as Request).url === 'string') requestUrl = (args[0] as Request).url;
    
    const method = (args[1]?.method || (args[0] instanceof Request ? (args[0] as Request).method : 'GET')).toUpperCase();

    // Ignore tracker urls and ignored urls
    if (!requestUrl || requestUrl.includes(config.endpoint) || config.ignoreUrls.some(u => requestUrl.includes(u))) {
      return originalFetch.apply(this, args);
    }

    let requestBody: string | undefined = undefined;
    if (config.captureNetworkBodies && args[1]?.body) {
      const rawBodyStr = extractBodyStr(args[1].body);
      if (rawBodyStr) {
        requestBody = maskNetworkBody(rawBodyStr, config.networkBodyMaskKeys);
      }
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
        } as any]
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

  // 2. XMLHttpRequest interceptor
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]) {
    (this as any)._rewindMethod = method.toUpperCase();
    (this as any)._rewindUrl = typeof url === 'string' ? url : (url instanceof URL ? url.href : '');
    return (originalXhrOpen as any).apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
    const startTime = Date.now();
    const method = (this as any)._rewindMethod || 'GET';
    const requestUrl = (this as any)._rewindUrl || '';

    if (!requestUrl || requestUrl.includes(config.endpoint) || config.ignoreUrls.some(u => requestUrl.includes(u))) {
      return originalXhrSend.apply(this, [body as any]);
    }

    let requestBody: string | undefined = undefined;
    if (config.captureNetworkBodies && body) {
      const rawBodyStr = extractBodyStr(body);
      if (rawBodyStr) {
        requestBody = maskNetworkBody(rawBodyStr, config.networkBodyMaskKeys);
      }
    }

    this.addEventListener('loadend', () => {
      const duration = Date.now() - startTime;
      let responseBody: string | undefined = undefined;
      
      if (config.captureNetworkBodies && (this.responseType === '' || this.responseType === 'text')) {
        try {
          if (this.responseText) {
            responseBody = maskNetworkBody(this.responseText, config.networkBodyMaskKeys);
          }
        } catch (e) {}
      }

      transport.send({
        type: 'network',
        requests: [{
          url: requestUrl,
          method,
          status: this.status,
          duration,
          timestamp: startTime,
          requestBody,
          responseBody
        } as any]
      });
    });

    return originalXhrSend.apply(this, [body as any]);
  };
}
