import { Transport } from '../transport';

export function setupConsoleCapture(transport: Transport) {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalInfo = console.info;

  let buffer: any[] = [];
  let flushTimer: any = null;

  const flush = () => {
    if (buffer.length === 0) return;
    transport.send({
      type: 'console',
      entries: [...buffer],
    });
    buffer = [];
  };

  const capture = (level: string, args: any[]) => {
    const message = args.map(a => {
      if (typeof a === 'object') {
        try { return JSON.stringify(a); } catch { return '[Unserializable]'; }
      }
      return String(a);
    }).join(' ');

    buffer.push({
      level,
      message,
      timestamp: Date.now(),
    });

    if (buffer.length >= 50) flush();
    else if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flush();
        flushTimer = null;
      }, 5000);
    }
  };

  console.error = (...args) => {
    capture('error', args);
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    capture('warn', args);
    originalWarn.apply(console, args);
  };

  console.log = (...args) => {
    capture('log', args);
    originalLog.apply(console, args);
  };

  console.info = (...args) => {
    capture('info', args);
    originalInfo.apply(console, args);
  };
}
