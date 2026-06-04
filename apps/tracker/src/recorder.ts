import { record } from 'rrweb';
import { RewindConfig } from './config';
import { Transport } from './transport';

export class Recorder {
  private config: RewindConfig;
  private transport: Transport;
  private buffer: any[] = [];
  private stopFn: (() => void) | null = null;
  private flushTimer: any = null;

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
  }

  public stop() {
    if (this.stopFn) {
      this.stopFn();
      this.stopFn = null;
    }
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
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
