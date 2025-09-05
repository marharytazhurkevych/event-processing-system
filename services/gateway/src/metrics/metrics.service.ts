import { Injectable } from '@nestjs/common';
import { Counter, Histogram, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly acceptedEventsCounter: Counter<string>;
  private readonly processedEventsCounter: Counter<string>;
  private readonly failedEventsCounter: Counter<string>;
  private readonly processingTimeHistogram: Histogram<string>;

  constructor() {
    this.acceptedEventsCounter = new Counter({
      name: 'gateway_events_accepted_total',
      help: 'Total number of events accepted by gateway',
      labelNames: ['source', 'funnel_stage'],
      registers: [register],
    });

    this.processedEventsCounter = new Counter({
      name: 'gateway_events_processed_total',
      help: 'Total number of events successfully processed by gateway',
      labelNames: ['source', 'funnel_stage'],
      registers: [register],
    });

    this.failedEventsCounter = new Counter({
      name: 'gateway_events_failed_total',
      help: 'Total number of events that failed processing in gateway',
      labelNames: ['source', 'funnel_stage'],
      registers: [register],
    });

    this.processingTimeHistogram = new Histogram({
      name: 'gateway_event_processing_duration_seconds',
      help: 'Time spent processing events in gateway',
      labelNames: ['source', 'funnel_stage'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [register],
    });
  }

  recordAcceptedEvent(source: string, funnelStage: string): void {
    this.acceptedEventsCounter.inc({ source, funnel_stage: funnelStage });
  }

  recordProcessedEvent(source: string, funnelStage: string): void {
    this.processedEventsCounter.inc({ source, funnel_stage: funnelStage });
  }

  recordFailedEvent(source: string, funnelStage: string): void {
    this.failedEventsCounter.inc({ source, funnel_stage: funnelStage });
  }

  recordProcessingTime(source: string, funnelStage: string, duration: number): void {
    this.processingTimeHistogram.observe({ source, funnel_stage: funnelStage }, duration);
  }
}
