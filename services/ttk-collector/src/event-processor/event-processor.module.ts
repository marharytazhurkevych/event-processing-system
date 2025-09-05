import { Module } from '@nestjs/common';
import { EventProcessorService } from './event-processor.service';
import { NatsModule } from '../nats/nats.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [NatsModule, MetricsModule],
  providers: [EventProcessorService],
})
export class EventProcessorModule {}
