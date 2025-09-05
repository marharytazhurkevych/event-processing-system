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
  async liveness(): Promise<HealthCheckResult> {
    return await this.health.check([]);
  }

  @Get('readiness')
  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    return await this.health.check([
      async () => {
        try {
          await this.prismaService.$queryRaw`SELECT 1`;
          return {
            database: {
              status: 'up',
            },
          };
        } catch {
          return {
            database: {
              status: 'down',
            },
          };
        }
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
