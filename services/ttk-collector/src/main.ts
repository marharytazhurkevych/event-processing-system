import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger } from '@shared/utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger('TTK-Collector'),
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3002);

  app.enableShutdownHooks();

  await app.listen(port);
  
  const logger = app.get(Logger);
  logger.log(`TikTok Collector service is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start TikTok Collector service:', error);
  process.exit(1);
});
