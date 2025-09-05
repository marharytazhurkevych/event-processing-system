import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, NatsConnection, JetStreamClient, ConsumerConfig } from 'nats';
import { Logger } from '@shared/utils';

@Injectable()
export class NatsService implements OnModuleDestroy {
  private connection: NatsConnection;
  private jetStream: JetStreamClient;
  private readonly logger = new Logger('NatsService');

  constructor(private readonly configService: ConfigService) {}

  async connect(): Promise<void> {
    try {
      const natsUrl = this.configService.get<string>('NATS_URL', 'nats://localhost:4222');
      
      this.connection = await connect({
        servers: natsUrl,
        name: 'fb-collector-service',
      });

      this.jetStream = this.connection.jetstream();

      this.logger.log('Connected to NATS JetStream');
    } catch (error) {
      this.logger.error('Failed to connect to NATS', error.stack);
      throw error;
    }
  }

  async subscribeToFacebookEvents(
    callback: (data: any) => Promise<void>
  ): Promise<void> {
    try {
      const consumerConfig: ConsumerConfig = {
        filter_subject: 'events.facebook.*',
        deliver_policy: 'all',
        ack_policy: 'explicit',
        replay_policy: 'instant',
        max_deliver: 3,
      };

      const consumer = await this.jetStream.consumers.add('FACEBOOK_EVENTS', consumerConfig);
      const messages = await consumer.consume();

      this.logger.log('Subscribed to Facebook events');

      for await (const message of messages) {
        try {
          const data = JSON.parse(message.string());
          await callback(data);
          message.ack();
        } catch (error) {
          this.logger.error('Failed to process Facebook event', error.stack);
          message.nak();
        }
      }
    } catch (error) {
      this.logger.error('Failed to subscribe to Facebook events', error.stack);
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
