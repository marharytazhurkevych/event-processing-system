import { z } from 'zod';

export const timeRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const reportFiltersSchema = timeRangeSchema.extend({
  source: z.enum(['facebook', 'tiktok']).optional(),
  funnelStage: z.enum(['top', 'bottom']).optional(),
  eventType: z.string().optional(),
  campaignId: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const eventSchema = z.object({
  eventId: z.string(),
  timestamp: z.string().datetime(),
  source: z.enum(['facebook', 'tiktok']),
  funnelStage: z.enum(['top', 'bottom']),
  eventType: z.string(),
  data: z.record(z.any()),
});

export const facebookEventSchema = z.object({
  eventId: z.string(),
  timestamp: z.string().datetime(),
  source: z.literal('facebook'),
  funnelStage: z.enum(['top', 'bottom']),
  eventType: z.enum(['ad.view', 'page.like', 'comment', 'video.view', 'ad.click', 'form.submission', 'checkout.complete']),
  data: z.object({
    user: z.object({
      userId: z.string(),
      name: z.string(),
      age: z.number(),
      gender: z.enum(['male', 'female', 'non-binary']),
      location: z.object({
        country: z.string(),
        city: z.string(),
      }),
    }),
    engagement: z.record(z.any()),
  }),
});

export const tiktokEventSchema = z.object({
  eventId: z.string(),
  timestamp: z.string().datetime(),
  source: z.literal('tiktok'),
  funnelStage: z.enum(['top', 'bottom']),
  eventType: z.enum(['video.view', 'like', 'share', 'comment', 'profile.visit', 'purchase', 'follow']),
  data: z.object({
    user: z.object({
      userId: z.string(),
      username: z.string(),
      followers: z.number(),
    }),
    engagement: z.record(z.any()),
  }),
});

export const webhookEventSchema = z.union([facebookEventSchema, tiktokEventSchema]);

export type TimeRangeInput = z.infer<typeof timeRangeSchema>;
export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type FacebookEventInput = z.infer<typeof facebookEventSchema>;
export type TiktokEventInput = z.infer<typeof tiktokEventSchema>;
export type WebhookEventInput = z.infer<typeof webhookEventSchema>;
