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
        timeout: 30000, // 30 seconds connection timeout
        reconnect: true,
        maxReconnectAttempts: -1, // unlimited reconnects
        reconnectTimeWait: 2000, // 2 seconds between reconnects
        pingInterval: 120000, // 2 minutes ping interval
        maxPingOut: 3, // 3 failed pings before disconnect
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
        maxAge: 7 * 24 * 60 * 60 * 1000 * 1000 * 1000, // 7 days in nanoseconds
        maxMsgs: 10000000, // 10 million messages
        maxBytes: 10 * 1024 * 1024 * 1024, // 10GB
        storage: 'file' as any, // persistent storage
      },
      {
        name: 'TIKTOK_EVENTS',
        subjects: ['events.tiktok.*'],
        retention: 'limits' as any,
        maxAge: 7 * 24 * 60 * 60 * 1000 * 1000 * 1000, // 7 days in nanoseconds
        maxMsgs: 10000000, // 10 million messages
        maxBytes: 10 * 1024 * 1024 * 1024, // 10GB
        storage: 'file' as any, // persistent storage
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
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const subject = `events.${source}.${event.funnelStage}`;
        const payload = {
          ...event,
          correlationId,
          publishedAt: new Date().toISOString(),
        };

        // Add timeout and retry logic
        const publishPromise = this.jetStream.publish(subject, JSON.stringify(payload));
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Publish timeout')), 10000) // 10 second timeout
        );

        await Promise.race([publishPromise, timeoutPromise]);
        this.logger.log(`Published event to ${subject}`, 'NatsService');
        return; // Success, exit retry loop
        
      } catch (error) {
        retryCount++;
        this.logger.error(`Failed to publish event to ${source} (attempt ${retryCount}/${maxRetries}): ${error.message}`);
        
        if (retryCount >= maxRetries) {
          this.logger.error(`Failed to publish event after ${maxRetries} attempts`, error.stack);
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
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
