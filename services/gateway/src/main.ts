import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger } from '@shared/utils';
import { initializeTracing } from '@shared/utils';

async function bootstrap() {
  // Initialize OpenTelemetry tracing
  initializeTracing('gateway-service');

  const app = await NestFactory.create(AppModule, {
    logger: new Logger('Gateway'),
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  app.enableShutdownHooks();

  await app.listen(port);
  
  const logger = app.get(Logger);
  logger.log(`Gateway service is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start Gateway service:', error);
  process.exit(1);
});
