import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private metrics = {
    acceptedEvents: 0,
    processedEvents: 0,
    failedEvents: 0,
    processingTimes: [] as number[],
  };

  recordAcceptedEvent(source: string, funnelStage: string): void {
    this.metrics.acceptedEvents++;
    console.log(`[METRICS] Accepted event: ${source}/${funnelStage} (total: ${this.metrics.acceptedEvents})`);
  }

  recordProcessedEvent(source: string, funnelStage: string): void {
    this.metrics.processedEvents++;
    console.log(`[METRICS] Processed event: ${source}/${funnelStage} (total: ${this.metrics.processedEvents})`);
  }

  recordFailedEvent(source: string, funnelStage: string): void {
    this.metrics.failedEvents++;
    console.log(`[METRICS] Failed event: ${source}/${funnelStage} (total: ${this.metrics.failedEvents})`);
  }

  recordProcessingTime(source: string, funnelStage: string, duration: number): void {
    this.metrics.processingTimes.push(duration);
    if (this.metrics.processingTimes.length > 1000) {
      this.metrics.processingTimes = this.metrics.processingTimes.slice(-1000);
    }
    console.log(`[METRICS] Processing time: ${source}/${funnelStage} - ${duration}ms`);
  }

  getMetrics() {
    const avgProcessingTime = this.metrics.processingTimes.length > 0 
      ? this.metrics.processingTimes.reduce((a, b) => a + b, 0) / this.metrics.processingTimes.length 
      : 0;

    return {
      acceptedEvents: this.metrics.acceptedEvents,
      processedEvents: this.metrics.processedEvents,
      failedEvents: this.metrics.failedEvents,
      averageProcessingTime: avgProcessingTime,
      successRate: this.metrics.acceptedEvents > 0 
        ? (this.metrics.processedEvents / this.metrics.acceptedEvents) * 100 
        : 0,
    };
  }
}