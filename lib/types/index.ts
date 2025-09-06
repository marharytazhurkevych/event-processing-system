export * from './events';

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  dependencies: {
    database: 'connected' | 'disconnected';
    nats: 'connected' | 'disconnected';
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  correlationId: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface TimeRangeParams {
  from?: string;
  to?: string;
}

export interface ReportFilters extends TimeRangeParams {
  source?: 'facebook' | 'tiktok';
  funnelStage?: 'top' | 'bottom';
  eventType?: string;
  campaignId?: string;
}
