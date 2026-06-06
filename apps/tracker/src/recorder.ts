import { record } from 'rrweb';
import { RewindConfig } from './config';
import { Transport } from './transport';

export class Recorder {
  private config: RewindConfig;
  private transport: Transport;
  private buffer: any[] = [];
  private stopFn: (() => void) | null = null;
  private flushTimer: any = null;
  private cleanupListeners: (() => void) | null = null;

  constructor(config: RewindConfig, transport: Transport) {
    this.config = config;
    this.transport = transport;
  }

  public start() {
    this.stopFn = record({
      emit: (event) => {
        this.buffer.push(event);
        if (this.buffer.length >= this.config.bufferSize) {
          this.flush();
        }
      },
      maskAllInputs: this.config.maskInputs,
      maskTextSelector: this.config.maskSelectors.join(','),
      blockSelector: this.config.blockSelectors.join(','),
      recordCanvas: true,
      collectFonts: true,
    }) || null;

    this.flushTimer = setInterval(() => {
      this.flush();
    }, 5000); // Flush every 5s regardless

    // Auto-flush when the page is hidden (tab switch, mobile background) or closed
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Use beaconFlush so isFinal=true is sent — triggers embedding pipeline
        this.beaconFlush();
      }
    };
    // beforeunload fires before the page unloads — last chance to send data
    const onBeforeUnload = () => {
      // Use beaconFlush for the final flush — guaranteed delivery even as page tears down
      this.beaconFlush();
      this.stop(false); // stop without flushing again
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);

    this.cleanupListeners = () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  } // end start()

  public stop(doFlush = true) {
    if (this.stopFn) {
      this.stopFn();
      this.stopFn = null;
    }
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.cleanupListeners) {
      this.cleanupListeners();
      this.cleanupListeners = null;
    }
    if (doFlush) this.flush();
  }

  // Used during unload — routes through transport.beaconFlush for guaranteed delivery
  private beaconFlush() {
    if (this.buffer.length === 0) return;
    const events = [...this.buffer];
    this.buffer = [];
    this.transport.beaconFlush({ type: 'batch', events, isFinal: true });
  }

  private flush() {
    if (this.buffer.length === 0) return;
    const events = [...this.buffer];
    this.buffer = [];

    this.transport.send({
      type: 'batch',
      events,
    });
  }
}
