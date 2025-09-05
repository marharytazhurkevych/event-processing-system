import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, NatsConnection, JetStreamClient, JetStreamManager } from 'nats';
import { Logger } from '@shared/utils';

@Injectable()
export class NatsService implements OnModuleDestroy {
  private connection: NatsConnection;
  private jetStream: JetStreamClient;
  private jetStreamManager: JetStreamManager;
  private readonly logger = new Logger('NatsService');

  constructor(private readonly configService: ConfigService) {}

  async connect(): Promise<void> {
    try {
      const natsUrl = this.configService.get<string>('NATS_URL', 'nats://localhost:4222');
      
      this.connection = await connect({
        servers: natsUrl,
        name: 'gateway-service',
      });

      this.jetStream = this.connection.jetstream();
      this.jetStreamManager = await this.connection.jetstreamManager();

      // Create streams if they don't exist
      await this.ensureStreams();

      this.logger.log('Connected to NATS JetStream');
    } catch (error) {
      this.logger.error('Failed to connect to NATS', error.stack);
      throw error;
    }
  }

  private async ensureStreams(): Promise<void> {
    const streams = [
      {
        name: 'FACEBOOK_EVENTS',
        subjects: ['events.facebook.*'],
        retention: 'limits' as any,
        maxAge: 24 * 60 * 60 * 1000 * 1000 * 1000, // 24 hours in nanoseconds
        maxMsgs: 1000000,
        maxBytes: 1024 * 1024 * 1024, // 1GB
      },
      {
        name: 'TIKTOK_EVENTS',
        subjects: ['events.tiktok.*'],
        retention: 'limits' as any,
        maxAge: 24 * 60 * 60 * 1000 * 1000 * 1000, // 24 hours in nanoseconds
        maxMsgs: 1000000,
        maxBytes: 1024 * 1024 * 1024, // 1GB
      },
    ];

    for (const streamConfig of streams) {
      try {
        await this.jetStreamManager.streams.add(streamConfig);
        this.logger.log(`Created stream: ${streamConfig.name}`);
      } catch (error) {
        if (error.message.includes('stream name already in use')) {
          this.logger.log(`Stream already exists: ${streamConfig.name}`);
        } else {
          this.logger.error(`Failed to create stream ${streamConfig.name}`, error.stack);
        }
      }
    }
  }

  async publishEvent(source: 'facebook' | 'tiktok', event: any, correlationId: string): Promise<void> {
    try {
      const subject = `events.${source}.${event.funnelStage}`;
      const payload = {
        ...event,
        correlationId,
        publishedAt: new Date().toISOString(),
      };

      await this.jetStream.publish(subject, JSON.stringify(payload));
      this.logger.log(`Published event to ${subject}`, 'NatsService');
    } catch (error) {
      this.logger.error(`Failed to publish event to ${source}`, error.stack);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connection && !this.connection.isClosed();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.connection && !this.connection.isClosed()) {
      await this.connection.close();
      this.logger.log('Disconnected from NATS');
    }
  }
}
