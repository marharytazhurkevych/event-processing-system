import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { NatsModule } from '../nats/nats.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [NatsModule, MetricsModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
