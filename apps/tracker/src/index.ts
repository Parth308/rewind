import { getConfig, RewindConfig } from './config';
import { Transport } from './transport';
import { Recorder } from './recorder';
import { setupConsoleCapture } from './capture/console';
import { setupNetworkCapture } from './capture/network';

const SESSION_ID_KEY  = '__rewind_sid';
const SESSION_EXP_KEY = '__rewind_exp';
const SESSION_TTL_MS  = 30 * 60 * 1000; // 30 min inactivity = new session

function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Returns the current session ID for this browser tab/window.
 *
 * Reuses the existing ID if the session hasn't expired (30 min inactivity window),
 * so navigating between pages counts as one session.
 *
 * localStorage is used so sessions persist across domain navigations and new tabs.
 */
function getOrCreateSessionId(): string {
  try {
    const sid    = localStorage.getItem(SESSION_ID_KEY);
    const expiry = Number(localStorage.getItem(SESSION_EXP_KEY) ?? 0);

    if (sid && Date.now() < expiry) {
      // Still within the inactivity window — reuse and extend
      localStorage.setItem(SESSION_EXP_KEY, String(Date.now() + SESSION_TTL_MS));
      return sid;
    }
  } catch {
    // localStorage unavailable — fall through to new ID
  }

  const newSid = generateSessionId();
  try {
    localStorage.setItem(SESSION_ID_KEY,  newSid);
    localStorage.setItem(SESSION_EXP_KEY, String(Date.now() + SESSION_TTL_MS));
  } catch {
    // ignore — ID won't persist across pages but at least this page works
  }
  return newSid;
}

let initialized = false;

function init(overrideConfig?: Partial<RewindConfig>) {
  if (initialized) return;
  
  const config = getConfig(overrideConfig);
  if (!config) return;

  initialized = true;

  // Reuse existing session ID if the user is still within the inactivity window
  // (e.g. navigated from page A → page B in the same tab)
  const sessionId = getOrCreateSessionId();
  
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
