import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NatsService } from '../nats/nats.service';
import { MetricsService } from '../metrics/metrics.service';
import { TiktokEvent, ProcessedEvent } from '@shared/types';
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
    this.logger.log('Starting TikTok event processor');
    this.startProcessing();
  }

  async onModuleDestroy() {
    this.logger.log('Stopping TikTok event processor');
    this.isProcessing = false;
  }

  private async startProcessing() {
    this.isProcessing = true;
    
    try {
      await this.natsService.subscribeToTiktokEvents(async (data) => {
        if (!this.isProcessing) return;
        
        await this.processTiktokEvent(data);
      });
    } catch (error) {
      this.logger.error('Failed to start event processing', error.stack);
    }
  }

  private async processTiktokEvent(eventData: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Processing TikTok event: ${eventData.eventId}`, 'EventProcessorService');
      
      const tiktokEvent = eventData as TiktokEvent;
      
      // Store the processed event
      await this.storeProcessedEvent(tiktokEvent, eventData.correlationId);
      
      // Store user demographics
      await this.storeUserDemographics(tiktokEvent);
      
      // Store revenue transaction if applicable
      if (this.isRevenueEvent(tiktokEvent)) {
        await this.storeRevenueTransaction(tiktokEvent);
      }
      
      // Record metrics
      this.metricsService.recordProcessedEvent('tiktok', tiktokEvent.funnelStage);
      
      const processingTime = Date.now() - startTime;
      this.logger.log(`TikTok event ${tiktokEvent.eventId} processed in ${processingTime}ms`, 'EventProcessorService');
      
    } catch (error) {
      this.metricsService.recordFailedEvent('tiktok', eventData.funnelStage || 'unknown');
      this.logger.error(`Failed to process TikTok event ${eventData.eventId}`, error.stack);
      throw error;
    }
  }

  private async storeProcessedEvent(event: TiktokEvent, correlationId: string): Promise<void> {
    await this.prisma.processedEvent.create({
      data: {
        eventId: event.eventId,
        timestamp: new Date(event.timestamp),
        source: event.source,
        funnelStage: event.funnelStage,
        eventType: event.eventType,
        userId: event.data.user.userId,
        rawData: event as any,
        correlationId,
      },
    });
  }

  private async storeUserDemographics(event: TiktokEvent): Promise<void> {
    const { user } = event.data;
    
    await this.prisma.userDemographics.upsert({
      where: {
        userId_source: {
          userId: user.userId,
          source: 'tiktok',
        },
      },
      update: {
        username: user.username,
        followers: user.followers,
        updatedAt: new Date(),
      },
      create: {
        userId: user.userId,
        source: 'tiktok',
        username: user.username,
        followers: user.followers,
      },
    });
  }

  private async storeRevenueTransaction(event: TiktokEvent): Promise<void> {
    const engagement = event.data.engagement as any;
    
    if (engagement.purchaseAmount) {
      await this.prisma.revenueTransaction.create({
        data: {
          eventId: event.eventId,
          userId: event.data.user.userId,
          source: 'tiktok',
          amount: parseFloat(engagement.purchaseAmount),
          currency: 'USD',
          campaignId: null, // TikTok doesn't have campaignId in the schema
          eventType: event.eventType,
          timestamp: new Date(event.timestamp),
        },
      });
    }
  }

  private isRevenueEvent(event: TiktokEvent): boolean {
    return event.eventType === 'purchase' || 
           (event.data.engagement as any)?.purchaseAmount;
  }
}
