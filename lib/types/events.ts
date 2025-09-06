export type FunnelStage = "top" | "bottom";

export type FacebookTopEventType = "ad.view" | "page.like" | "comment" | "video.view";
export type FacebookBottomEventType = "ad.click" | "form.submission" | "checkout.complete";
export type FacebookEventType = FacebookTopEventType | FacebookBottomEventType;

export interface FacebookUserLocation {
  country: string;
  city: string;
}

export interface FacebookUser {
  userId: string;
  name: string;
  age: number;
  gender: "male" | "female" | "non-binary";
  location: FacebookUserLocation;
}

export interface FacebookEngagementTop {
  actionTime: string;
  referrer: "newsfeed" | "marketplace" | "groups";
  videoId: string | null;
}

export interface FacebookEngagementBottom {
  adId: string;
  campaignId: string;
  clickPosition: "top_left" | "bottom_right" | "center";
  device: "mobile" | "desktop";
  browser: "Chrome" | "Firefox" | "Safari";
  purchaseAmount: string | null;
}

export type FacebookEngagement = FacebookEngagementTop | FacebookEngagementBottom;

export interface FacebookEvent {
  eventId: string;
  timestamp: string;
  source: "facebook";
  funnelStage: FunnelStage;
  eventType: FacebookEventType;
  data: {
    user: FacebookUser;
    engagement: FacebookEngagement;
  };
}

export type TiktokTopEventType = "video.view" | "like" | "share" | "comment";
export type TiktokBottomEventType = "profile.visit" | "purchase" | "follow";
export type TiktokEventType = TiktokTopEventType | TiktokBottomEventType;

export interface TiktokUser {
  userId: string;
  username: string;
  followers: number;
}

export interface TiktokEngagementTop {
  watchTime: number;
  percentageWatched: number;
  device: "Android" | "iOS" | "Desktop";
  country: string;
  videoId: string;
}

export interface TiktokEngagementBottom {
  actionTime: string;
  profileId: string | null;
  purchasedItem: string | null;
  purchaseAmount: string | null;
}

export type TiktokEngagement = TiktokEngagementTop | TiktokEngagementBottom;

export interface TiktokEvent {
  eventId: string;
  timestamp: string;
  source: "tiktok";
  funnelStage: FunnelStage;
  eventType: TiktokEventType;
  data: {
    user: TiktokUser;
    engagement: TiktokEngagement;
  };
}

export type Event = FacebookEvent | TiktokEvent;

// Additional types for processing
export interface ProcessedEvent {
  id: string;
  eventId: string;
  timestamp: Date;
  source: "facebook" | "tiktok";
  funnelStage: FunnelStage;
  eventType: string;
  userId: string;
  rawData: any;
  processedAt: Date;
  correlationId: string;
}

// Report types
export interface EventStats {
  totalEvents: number;
  eventsBySource: Record<string, number>;
  eventsByFunnelStage: Record<string, number>;
  eventsByType: Record<string, number>;
  timeRange: {
    from: Date;
    to: Date;
  };
}

export interface RevenueData {
  totalRevenue: number;
  revenueBySource: Record<string, number>;
  revenueByCampaign: Record<string, number>;
  transactionCount: number;
  timeRange: {
    from: Date;
    to: Date;
  };
}

export interface DemographicsData {
  facebook: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
    topLocations: Array<{ location: string; count: number }>;
  };
  tiktok: {
    followerRanges: Record<string, number>;
    topCountries: Array<{ country: string; count: number }>;
  };
  timeRange: {
    from: Date;
    to: Date;
  };
}
