import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { PrometheusModule } from '@nestjs/prometheus';
import { PrismaModule } from './prisma/prisma.module';
import { NatsModule } from './nats/nats.module';
import { EventProcessorModule } from './event-processor/event-processor.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrometheusModule.register(),
    TerminusModule,
    PrismaModule,
    NatsModule,
    EventProcessorModule,
    HealthModule,
    MetricsModule,
  ],
})
export class AppModule {}
