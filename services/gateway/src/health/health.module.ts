import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [TerminusModule, NatsModule],
  controllers: [HealthController],
})
export class HealthModule {}
