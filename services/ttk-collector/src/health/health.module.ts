import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { NatsModule } from '../nats/nats.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [TerminusModule, NatsModule, PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
