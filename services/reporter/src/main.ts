import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger } from '@shared/utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger('Reporter'),
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3003);

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  app.enableShutdownHooks();

  await app.listen(port);
  
  const logger = app.get(Logger);
  logger.log(`Reporter service is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start Reporter service:', error);
  process.exit(1);
});
