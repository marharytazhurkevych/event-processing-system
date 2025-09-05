import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { NatsService } from '../nats/nats.service';
import { MetricsService } from '../metrics/metrics.service';

describe('WebhookService', () => {
  let service: WebhookService;
  let natsService: jest.Mocked<NatsService>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    const mockNatsService = {
      publishEvent: jest.fn(),
    };

    const mockMetricsService = {
      recordAcceptedEvent: jest.fn(),
      recordProcessedEvent: jest.fn(),
      recordFailedEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: NatsService,
          useValue: mockNatsService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    natsService = module.get(NatsService);
    metricsService = module.get(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process Facebook event successfully', async () => {
    const mockEvent = {
      eventId: 'test-event-1',
      timestamp: '2024-01-01T00:00:00Z',
      source: 'facebook' as const,
      funnelStage: 'top' as const,
      eventType: 'ad.view' as const,
      data: {
        user: {
          userId: 'user-1',
          name: 'Test User',
          age: 25,
          gender: 'male' as const,
          location: {
            country: 'US',
            city: 'New York',
          },
        },
        engagement: {
          actionTime: '2024-01-01T00:00:00Z',
          referrer: 'newsfeed' as const,
          videoId: null,
        },
      },
    };

    const correlationId = 'test-correlation-id';

    await service.processEvent(mockEvent, correlationId);

    expect(metricsService.recordAcceptedEvent).toHaveBeenCalledWith('facebook', 'top');
    expect(natsService.publishEvent).toHaveBeenCalledWith('facebook', mockEvent, correlationId);
    expect(metricsService.recordProcessedEvent).toHaveBeenCalledWith('facebook', 'top');
  });

  it('should handle processing errors', async () => {
    const mockEvent = {
      eventId: 'test-event-1',
      timestamp: '2024-01-01T00:00:00Z',
      source: 'facebook' as const,
      funnelStage: 'top' as const,
      eventType: 'ad.view' as const,
      data: {
        user: {
          userId: 'user-1',
          name: 'Test User',
          age: 25,
          gender: 'male' as const,
          location: {
            country: 'US',
            city: 'New York',
          },
        },
        engagement: {
          actionTime: '2024-01-01T00:00:00Z',
          referrer: 'newsfeed' as const,
          videoId: null,
        },
      },
    };

    const correlationId = 'test-correlation-id';
    const error = new Error('NATS connection failed');

    natsService.publishEvent.mockRejectedValue(error);

    await expect(service.processEvent(mockEvent, correlationId)).rejects.toThrow(error);
    expect(metricsService.recordAcceptedEvent).toHaveBeenCalledWith('facebook', 'top');
    expect(metricsService.recordFailedEvent).toHaveBeenCalledWith('facebook', 'top');
  });
});
