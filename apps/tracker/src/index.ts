import { getConfig, RewindConfig } from './config';
import { Transport } from './transport';
import { Recorder } from './recorder';
import { setupConsoleCapture } from './capture/console';
import { setupNetworkCapture } from './capture/network';

function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let initialized = false;

function init(overrideConfig?: Partial<RewindConfig>) {
  if (initialized) return;
  
  const config = getConfig(overrideConfig);
  if (!config) return;

  initialized = true;

  // Simple session ID generation since tracker runs fully client-side
  const sessionId = generateSessionId();
  
  console.log(`[Rewind] Tracker initialized successfully. Session ID: ${sessionId}`);

  const transport = new Transport(config, sessionId);
  
  // Send metadata right away
  if (config.userId || Object.keys(config.metadata).length > 0 || true) {
    transport.send({
      type: 'metadata',
      userAgent: navigator.userAgent,
      url: window.location.href,
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      metadata: {
        userId: config.userId,
        ...config.metadata,
      }
    });
  }

  const recorder = new Recorder(config, transport);
  
  setupConsoleCapture(transport);
  setupNetworkCapture(transport, config);

  recorder.start();
  console.log('[Rewind] Recording started.');

  // Attach to window for external control
  (window as any).__rewindInstance = {
    stop: () => recorder.stop(),
    sessionId,
  };
}

// Expose the API globally as documented
(window as any).Rewind = {
  init
};

// Try to auto-start if window.__rewind is already present
const tryAutoInit = () => {
  if ((window as any).__rewind) {
    init();
  }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  tryAutoInit();
} else {
  document.addEventListener('DOMContentLoaded', tryAutoInit);
}
