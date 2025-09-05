import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { webhookEventSchema, WebhookEventInput } from '@shared/utils';
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
}
