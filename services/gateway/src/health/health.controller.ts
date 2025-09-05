import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { NatsService } from '../nats/nats.service';
import { HealthCheckResponse } from '@shared/types';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly natsService: NatsService,
  ) {}

  @Get('liveness')
  @HealthCheck()
  async liveness(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Get('readiness')
  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => {
        const isNatsConnected = this.natsService.isConnected();
        return {
          nats: {
            status: isNatsConnected ? 'up' : 'down',
          },
        };
      },
    ]);
  }

  @Get()
  getHealth(): HealthCheckResponse {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      dependencies: {
        database: 'connected', // Gateway doesn't use database directly
        nats: this.natsService.isConnected() ? 'connected' : 'disconnected',
      },
    };
  }
}
