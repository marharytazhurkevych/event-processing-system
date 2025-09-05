import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NatsService } from '../nats/nats.service';
import { MetricsService } from '../metrics/metrics.service';
import { FacebookEvent, ProcessedEvent } from '@shared/types';
import { Logger } from '@shared/utils';

@Injectable()
export class EventProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('EventProcessorService');
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly natsService: NatsService,
    private readonly metricsService: MetricsService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting Facebook event processor');
    this.startProcessing();
  }

  async onModuleDestroy() {
    this.logger.log('Stopping Facebook event processor');
    this.isProcessing = false;
  }

  private async startProcessing() {
    this.isProcessing = true;
    
    try {
      await this.natsService.subscribeToFacebookEvents(async (data) => {
        if (!this.isProcessing) return;
        
        await this.processFacebookEvent(data);
      });
    } catch (error) {
      this.logger.error('Failed to start event processing', error.stack);
    }
  }

  private async processFacebookEvent(eventData: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Processing Facebook event: ${eventData.eventId}`, 'EventProcessorService');
      
      const facebookEvent = eventData as FacebookEvent;
      
      // Use batch operations for better performance
      await this.processEventBatch([facebookEvent], eventData.correlationId);
      
      const processingTime = Date.now() - startTime;
      this.logger.log(`Facebook event ${facebookEvent.eventId} processed in ${processingTime}ms`, 'EventProcessorService');
      
    } catch (error) {
      this.metricsService.recordFailedEvent('facebook', eventData.funnelStage || 'unknown');
      this.logger.error(`Failed to process Facebook event ${eventData.eventId}`, error.stack);
      throw error;
    }
  }

  private async processEventBatch(events: FacebookEvent[], correlationId: string): Promise<void> {
    try {
      // Prepare batch data
      const processedEvents = events.map(event => ({
        eventId: event.eventId,
        timestamp: new Date(event.timestamp),
        source: event.source,
        funnelStage: event.funnelStage,
        eventType: event.eventType,
        userId: event.data.user.userId,
        rawData: event.data,
        correlationId,
      }));

      const userDemographics = events.map(event => ({
        userId: event.data.user.userId,
        source: 'facebook' as const,
        name: event.data.user.name,
        age: event.data.user.age,
        gender: event.data.user.gender,
        country: event.data.user.location.country,
        city: event.data.user.location.city,
      }));

      const revenueTransactions = events
        .filter(event => this.isRevenueEvent(event))
        .map(event => {
          const engagement = event.data.engagement as any;
          return {
            eventId: event.eventId,
            userId: event.data.user.userId,
            source: 'facebook' as const,
            amount: parseFloat(engagement.purchaseAmount || '0'),
            currency: 'USD',
            campaignId: engagement.campaignId || null,
            eventType: event.eventType,
            timestamp: new Date(event.timestamp),
          };
        });

      // Execute batch operations in parallel
      const operations = [
        this.prisma.processedEvent.createMany({
          data: processedEvents,
          skipDuplicates: true,
        }),
        this.prisma.userDemographics.createMany({
          data: userDemographics,
          skipDuplicates: true,
        }),
      ];

      if (revenueTransactions.length > 0) {
        operations.push(
          this.prisma.revenueTransaction.createMany({
            data: revenueTransactions,
            skipDuplicates: true,
          })
        );
      }

      await Promise.all(operations);

      // Record metrics for all events
      events.forEach(event => {
        this.metricsService.recordProcessedEvent('facebook', event.funnelStage);
      });

      this.logger.log(`Batch processed ${events.length} Facebook events successfully`);

    } catch (error) {
      this.logger.error(`Failed to process batch of ${events.length} Facebook events`, error.stack);
      throw error;
    }
  }

  private async storeProcessedEvent(event: FacebookEvent, correlationId: string): Promise<void> {
    await this.prisma.processedEvent.create({
      data: {
        eventId: event.eventId,
        timestamp: new Date(event.timestamp),
        source: event.source,
        funnelStage: event.funnelStage,
        eventType: event.eventType,
        userId: event.data.user.userId,
        rawData: event,
        correlationId,
      },
    });
  }

  private async storeUserDemographics(event: FacebookEvent): Promise<void> {
    const { user } = event.data;
    
    await this.prisma.userDemographics.upsert({
      where: {
        userId_source: {
          userId: user.userId,
          source: 'facebook',
        },
      },
      update: {
        age: user.age,
        gender: user.gender,
        country: user.location.country,
        city: user.location.city,
        updatedAt: new Date(),
      },
      create: {
        userId: user.userId,
        source: 'facebook',
        age: user.age,
        gender: user.gender,
        country: user.location.country,
        city: user.location.city,
      },
    });
  }

  private async storeRevenueTransaction(event: FacebookEvent): Promise<void> {
    const engagement = event.data.engagement as any;
    
    if (engagement.purchaseAmount) {
      await this.prisma.revenueTransaction.create({
        data: {
          eventId: event.eventId,
          userId: event.data.user.userId,
          source: 'facebook',
          amount: parseFloat(engagement.purchaseAmount),
          currency: 'USD',
          campaignId: engagement.campaignId || null,
          eventType: event.eventType,
          timestamp: new Date(event.timestamp),
        },
      });
    }
  }

  private isRevenueEvent(event: FacebookEvent): boolean {
    return event.eventType === 'checkout.complete' || 
           (event.data.engagement as any)?.purchaseAmount;
  }
}
