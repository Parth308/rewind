import { Transport } from '../transport';
import { RewindConfig } from '../config';

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

    try {
      const response = await originalFetch.apply(this, args);
      const duration = Date.now() - startTime;
      
      transport.send({
        type: 'network',
        requests: [{
          url: requestUrl,
          method,
          status: response.status,
          duration,
          timestamp: startTime,
        }]
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
        }]
      });
      throw err;
    }
  };
}
