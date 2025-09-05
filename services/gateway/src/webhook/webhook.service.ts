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

  async processBulkEvents(
    events: WebhookEventInput[], 
    correlationId: string
  ): Promise<{ processed: number; failed: number; errors: string[] }> {
    const startTime = Date.now();
    const batchSize = 1000; // Process in batches of 1000
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];
    
    this.logger.log(`Starting bulk processing of ${events.length} events in batches of ${batchSize}`);
    
    // Process events in batches
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(events.length / batchSize);
      
      this.logger.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} events)`);
      
      try {
        // Group events by source for bulk publishing
        const eventsBySource = batch.reduce((acc, event) => {
          if (!acc[event.source]) {
            acc[event.source] = [];
          }
          acc[event.source].push(event);
          return acc;
        }, {} as Record<string, WebhookEventInput[]>);

        // Process each source group
        const sourcePromises = Object.entries(eventsBySource).map(async ([source, sourceEvents]) => {
          try {
            // Record accepted events metrics
            sourceEvents.forEach(event => {
              this.metricsService.recordAcceptedEvent(event.source, event.funnelStage);
            });
            
            // Publish to NATS JetStream in bulk
            const result = await this.natsService.publishBulkEvents(
              source as 'facebook' | 'tiktok', 
              sourceEvents, 
              correlationId
            );
            
            // Record processed events metrics
            sourceEvents.forEach(event => {
              this.metricsService.recordProcessedEvent(event.source, event.funnelStage);
            });
            
            return { 
              success: true, 
              published: result.published, 
              failed: result.failed,
              source 
            };
          } catch (error) {
            // Record failed events metrics
            sourceEvents.forEach(event => {
              this.metricsService.recordFailedEvent(event.source, event.funnelStage);
            });
            
            return { 
              success: false, 
              published: 0, 
              failed: sourceEvents.length,
              source,
              error: error.message 
            };
          }
        });
        
        const batchResults = await Promise.allSettled(sourcePromises);
        
        // Count results
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            const value = result.value;
            processed += value.published;
            failed += value.failed;
            
            if (!value.success && value.error) {
              errors.push(`Source ${value.source}: ${value.error}`);
            }
          } else {
            failed += batch.length;
            errors.push(`Promise rejected: ${result.reason}`);
          }
        });
        
        // Log batch progress
        const batchProcessed = batchResults
          .filter(r => r.status === 'fulfilled')
          .reduce((sum, r) => sum + (r.value as any).published, 0);
        const batchFailed = batch.length - batchProcessed;
        
        this.logger.log(`Batch ${batchNumber} completed: ${batchProcessed} processed, ${batchFailed} failed`);
        
        // Small delay between batches to prevent overwhelming the system
        if (i + batchSize < events.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
      } catch (error) {
        this.logger.error(`Failed to process batch ${batchNumber}`, error.stack);
        failed += batch.length;
        errors.push(`Batch ${batchNumber} failed: ${error.message}`);
      }
    }
    
    const totalTime = Date.now() - startTime;
    const rate = (processed / totalTime) * 1000; // events per second
    
    this.logger.log(`Bulk processing completed: ${processed} processed, ${failed} failed in ${totalTime}ms (${rate.toFixed(1)} events/sec)`);
    
    return { processed, failed, errors };
  }
}
