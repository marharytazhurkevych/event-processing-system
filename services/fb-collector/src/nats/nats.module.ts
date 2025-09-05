import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NatsService } from './nats.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: NatsService,
      useFactory: async (configService: ConfigService) => {
        const natsService = new NatsService(configService);
        await natsService.connect();
        return natsService;
      },
      inject: [ConfigService],
    },
  ],
  exports: [NatsService],
})
export class NatsModule {}
