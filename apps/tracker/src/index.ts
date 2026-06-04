import { getConfig } from './config';
import { Transport } from './transport';
import { Recorder } from './recorder';

function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function init() {
  const config = getConfig();
  if (!config) return;

  // Simple session ID generation since tracker runs fully client-side
  const sessionId = generateSessionId();

  const transport = new Transport(config, sessionId);
  
  // Send metadata right away
  if (config.userId || Object.keys(config.metadata).length > 0) {
    transport.send({
      type: 'metadata',
      metadata: {
        userId: config.userId,
        ...config.metadata,
      }
    });
  }

  const recorder = new Recorder(config, transport);
  
  recorder.start();

  // Attach to window for external control
  (window as any).__rewindInstance = {
    stop: () => recorder.stop(),
    sessionId,
  };
}

// Start immediately when the script loads
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
