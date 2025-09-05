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
        name: 'ttk-collector-service',
        timeout: 30000, // 30 seconds connection timeout
        reconnect: true,
        maxReconnectAttempts: -1, // unlimited reconnects
        reconnectTimeWait: 2000, // 2 seconds between reconnects
        pingInterval: 120000, // 2 minutes ping interval
        maxPingOut: 3, // 3 failed pings before disconnect
      });

      this.jetStream = this.connection.jetstream();

      this.logger.log('Connected to NATS JetStream');
    } catch (error) {
      this.logger.error('Failed to connect to NATS', error.stack);
      throw error;
    }
  }

  async subscribeToTiktokEvents(
    callback: (data: any) => Promise<void>
  ): Promise<void> {
    try {
      const consumerConfig: ConsumerConfig = {
        filter_subject: 'events.tiktok.*',
        deliver_policy: 'all' as any,
        ack_policy: 'explicit' as any,
        replay_policy: 'instant' as any,
        max_deliver: 5, // Increased retry attempts
        ack_wait: 30000000000, // 30 seconds ack wait (in nanoseconds)
        idle_heartbeat: 30000000000, // 30 seconds heartbeat
        flow_control: true, // Enable flow control
      };

      const consumer = await (this.jetStream.consumers as any).add('TIKTOK_EVENTS', consumerConfig);
      const messages = await consumer.consume();

      this.logger.log('Subscribed to TikTok events');

      for await (const message of messages) {
        const startTime = Date.now();
        try {
          const data = JSON.parse(message.string());
          
          // Add timeout for processing
          const processingPromise = callback(data);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Processing timeout')), 30000) // 30 second timeout
          );
          
          await Promise.race([processingPromise, timeoutPromise]);
          
          const processingTime = Date.now() - startTime;
          this.logger.log(`Processed TikTok event in ${processingTime}ms`);
          message.ack();
          
        } catch (error) {
          const processingTime = Date.now() - startTime;
          this.logger.error(`Failed to process TikTok event after ${processingTime}ms: ${error.message}`, error.stack);
          
          // Check if it's a timeout or processing error
          if (error.message.includes('timeout')) {
            this.logger.error('Event processing timed out, will retry');
            message.nak(); // Negative acknowledgment for retry
          } else {
            this.logger.error('Event processing failed permanently');
            message.term(); // Terminate message (don't retry)
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to subscribe to TikTok events', error.stack);
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
