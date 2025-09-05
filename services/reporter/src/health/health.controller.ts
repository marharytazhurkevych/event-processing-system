import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { HealthCheckResponse } from '@shared/types';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get('liveness')
  @HealthCheck()
  liveness(): HealthCheckResult {
    return this.health.check([]);
  }

  @Get('readiness')
  @HealthCheck()
  readiness(): HealthCheckResult {
    return this.health.check([
      () => {
        return this.prismaService.$queryRaw`SELECT 1`
          .then(() => ({
            database: {
              status: 'up',
            },
          }))
          .catch(() => ({
            database: {
              status: 'down',
            },
          }));
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
        database: 'connected',
        nats: 'connected', // Reporter doesn't use NATS directly
      },
    };
  }
}
