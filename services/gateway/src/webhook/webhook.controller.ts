import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { webhookEventSchema, WebhookEventInput, bulkWebhookEventSchema } from '@shared/utils';
import { Logger } from '@shared/utils';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger('WebhookController');

  constructor(private readonly webhookService: WebhookService) {}

  @Post('events')
  @HttpCode(HttpStatus.OK)
  async receiveEvent(
    @Body() event: WebhookEventInput,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<{ success: boolean; message: string }> {
    const requestCorrelationId = correlationId || this.logger.getCorrelationId();
    this.logger.setCorrelationId(requestCorrelationId);

    try {
      // Validate the event
      const validatedEvent = webhookEventSchema.parse(event);
      
      await this.webhookService.processEvent(validatedEvent, requestCorrelationId);
      
      return {
        success: true,
        message: 'Event processed successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to process webhook event: ${error.message}`, error.stack);
      
      if (error.name === 'ZodError') {
        return {
          success: false,
          message: 'Invalid event format',
        };
      }
      
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  @Post('events/bulk')
  @HttpCode(HttpStatus.OK)
  async receiveBulkEvents(
    @Body() bulkData: { events: WebhookEventInput[] },
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<{ 
    success: boolean; 
    message: string; 
    processed: number; 
    failed: number; 
    errors?: string[] 
  }> {
    const requestCorrelationId = correlationId || this.logger.getCorrelationId();
    this.logger.setCorrelationId(requestCorrelationId);

    try {
      // Validate bulk data
      const validatedBulkData = bulkWebhookEventSchema.parse(bulkData);
      const { events } = validatedBulkData;
      
      this.logger.log(`Processing bulk request with ${events.length} events`);
      
      const result = await this.webhookService.processBulkEvents(events, requestCorrelationId);
      
      return {
        success: true,
        message: `Bulk processing completed: ${result.processed} processed, ${result.failed} failed`,
        processed: result.processed,
        failed: result.failed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to process bulk webhook events: ${error.message}`, error.stack);
      
      if (error.name === 'ZodError') {
        return {
          success: false,
          message: 'Invalid bulk event format',
          processed: 0,
          failed: bulkData.events?.length || 0,
        };
      }
      
      return {
        success: false,
        message: 'Internal server error',
        processed: 0,
        failed: bulkData.events?.length || 0,
      };
    }
  }
}
