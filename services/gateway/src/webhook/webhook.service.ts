import { Injectable } from '@nestjs/common';
import { NatsService } from '../nats/nats.service';
import { MetricsService } from '../metrics/metrics.service';
import { WebhookEventInput } from '@shared/utils';
import { Logger } from '@shared/utils';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger('WebhookService');

  constructor(
    private readonly natsService: NatsService,
    private readonly metricsService: MetricsService,
  ) {}

  async processEvent(event: WebhookEventInput, correlationId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Processing ${event.source} event: ${event.eventId}`, 'WebhookService');
      
      // Record accepted event metric
      this.metricsService.recordAcceptedEvent(event.source, event.funnelStage);
      
      // Publish to NATS JetStream
      await this.natsService.publishEvent(event.source, event, correlationId);
      
      // Record processed event metric
      this.metricsService.recordProcessedEvent(event.source, event.funnelStage);
      
      const processingTime = Date.now() - startTime;
      this.logger.log(`Event ${event.eventId} processed in ${processingTime}ms`, 'WebhookService');
      
    } catch (error) {
      // Record failed event metric
      this.metricsService.recordFailedEvent(event.source, event.funnelStage);
      
      this.logger.error(`Failed to process event ${event.eventId}`, error.stack);
      throw error;
    }
  }
}
