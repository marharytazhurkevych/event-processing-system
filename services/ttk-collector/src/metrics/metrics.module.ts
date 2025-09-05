import { Module } from '@nestjs/common';
import { PrometheusModule } from '@nestjs/prometheus';
import { MetricsService } from './metrics.service';

@Module({
  imports: [PrometheusModule.register()],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
