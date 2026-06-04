import { Transport } from '../transport';

export function setupConsoleCapture(transport: Transport) {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalInfo = console.info;

  const capture = (level: string, args: any[]) => {
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    transport.send({
      type: 'console',
      entries: [{
        level,
        message,
        timestamp: Date.now(),
      }]
    });
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
