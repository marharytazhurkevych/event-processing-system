import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { ReportFiltersInput, EventStats, RevenueData, DemographicsData } from '@shared/types';
import { Logger } from '@shared/utils';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger('ReportsService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) {}

  async getEventStats(filters: ReportFiltersInput): Promise<EventStats> {
    const { from, to, source, funnelStage, eventType } = filters;
    
    const whereClause: any = {};
    
    if (from || to) {
      whereClause.timestamp = {};
      if (from) whereClause.timestamp.gte = new Date(from);
      if (to) whereClause.timestamp.lte = new Date(to);
    }
    
    if (source) whereClause.source = source;
    if (funnelStage) whereClause.funnelStage = funnelStage;
    if (eventType) whereClause.eventType = eventType;

    const [
      totalEvents,
      eventsBySource,
      eventsByFunnelStage,
      eventsByType,
    ] = await Promise.all([
      this.prisma.processedEvent.count({ where: whereClause }),
      this.prisma.processedEvent.groupBy({
        by: ['source'],
        where: whereClause,
        _count: { source: true },
      }),
      this.prisma.processedEvent.groupBy({
        by: ['funnelStage'],
        where: whereClause,
        _count: { funnelStage: true },
      }),
      this.prisma.processedEvent.groupBy({
        by: ['eventType'],
        where: whereClause,
        _count: { eventType: true },
      }),
    ]);

    return {
      totalEvents,
      eventsBySource: eventsBySource.reduce((acc, item) => {
        acc[item.source] = item._count.source;
        return acc;
      }, {} as Record<string, number>),
      eventsByFunnelStage: eventsByFunnelStage.reduce((acc, item) => {
        acc[item.funnelStage] = item._count.funnelStage;
        return acc;
      }, {} as Record<string, number>),
      eventsByType: eventsByType.reduce((acc, item) => {
        acc[item.eventType] = item._count.eventType;
        return acc;
      }, {} as Record<string, number>),
      timeRange: {
        from: from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: to ? new Date(to) : new Date(),
      },
    };
  }

  async getRevenueData(filters: ReportFiltersInput): Promise<RevenueData> {
    const { from, to, source, campaignId } = filters;
    
    const whereClause: any = {};
    
    if (from || to) {
      whereClause.timestamp = {};
      if (from) whereClause.timestamp.gte = new Date(from);
      if (to) whereClause.timestamp.lte = new Date(to);
    }
    
    if (source) whereClause.source = source;
    if (campaignId) whereClause.campaignId = campaignId;

    const [
      totalRevenue,
      revenueBySource,
      revenueByCampaign,
      transactionCount,
    ] = await Promise.all([
      this.prisma.revenueTransaction.aggregate({
        where: whereClause,
        _sum: { amount: true },
      }),
      this.prisma.revenueTransaction.groupBy({
        by: ['source'],
        where: whereClause,
        _sum: { amount: true },
        _count: { source: true },
      }),
      this.prisma.revenueTransaction.groupBy({
        by: ['campaignId'],
        where: whereClause,
        _sum: { amount: true },
        _count: { campaignId: true },
      }),
      this.prisma.revenueTransaction.count({ where: whereClause }),
    ]);

    return {
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      revenueBySource: revenueBySource.reduce((acc, item) => {
        acc[item.source] = Number(item._sum.amount || 0);
        return acc;
      }, {} as Record<string, number>),
      revenueByCampaign: revenueByCampaign.reduce((acc, item) => {
        const campaign = item.campaignId || 'unknown';
        acc[campaign] = Number(item._sum.amount || 0);
        return acc;
      }, {} as Record<string, number>),
      transactionCount,
      timeRange: {
        from: from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: to ? new Date(to) : new Date(),
      },
    };
  }

  async getDemographicsData(filters: ReportFiltersInput): Promise<DemographicsData> {
    const { from, to, source } = filters;
    
    const whereClause: any = {};
    
    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt.gte = new Date(from);
      if (to) whereClause.createdAt.lte = new Date(to);
    }
    
    if (source) whereClause.source = source;

    const [facebookDemographics, tiktokDemographics] = await Promise.all([
      this.getFacebookDemographics(whereClause),
      this.getTiktokDemographics(whereClause),
    ]);

    return {
      facebook: facebookDemographics,
      tiktok: tiktokDemographics,
      timeRange: {
        from: from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: to ? new Date(to) : new Date(),
      },
    };
  }

  private async getFacebookDemographics(whereClause: any) {
    const facebookWhere = { ...whereClause, source: 'facebook' };
    
    const [ageGroups, genderDistribution, topLocations] = await Promise.all([
      this.prisma.userDemographics.groupBy({
        by: ['age'],
        where: facebookWhere,
        _count: { age: true },
      }),
      this.prisma.userDemographics.groupBy({
        by: ['gender'],
        where: facebookWhere,
        _count: { gender: true },
      }),
      this.prisma.userDemographics.groupBy({
        by: ['country', 'city'],
        where: facebookWhere,
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      ageGroups: ageGroups.reduce((acc, item) => {
        const ageGroup = this.getAgeGroup(item.age);
        acc[ageGroup] = (acc[ageGroup] || 0) + item._count.age;
        return acc;
      }, {} as Record<string, number>),
      genderDistribution: genderDistribution.reduce((acc, item) => {
        acc[item.gender || 'unknown'] = item._count.gender;
        return acc;
      }, {} as Record<string, number>),
      topLocations: topLocations.map(item => ({
        location: `${item.city}, ${item.country}`,
        count: item._count.country,
      })),
    };
  }

  private async getTiktokDemographics(whereClause: any) {
    const tiktokWhere = { ...whereClause, source: 'tiktok' };
    
    const [followerRanges, topCountries] = await Promise.all([
      this.prisma.userDemographics.findMany({
        where: tiktokWhere,
        select: { followers: true },
      }),
      this.prisma.userDemographics.groupBy({
        by: ['country'],
        where: tiktokWhere,
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
    ]);

    const followerRangesData = followerRanges.reduce((acc, item) => {
      const range = this.getFollowerRange(item.followers);
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      followerRanges: followerRangesData,
      topCountries: topCountries.map(item => ({
        country: item.country || 'unknown',
        count: item._count.country,
      })),
    };
  }

  private getAgeGroup(age: number | null): string {
    if (!age) return 'unknown';
    if (age < 18) return 'under_18';
    if (age < 25) return '18_24';
    if (age < 35) return '25_34';
    if (age < 45) return '35_44';
    if (age < 55) return '45_54';
    return '55_plus';
  }

  private getFollowerRange(followers: number | null): string {
    if (!followers) return 'unknown';
    if (followers < 1000) return 'under_1k';
    if (followers < 10000) return '1k_10k';
    if (followers < 100000) return '10k_100k';
    if (followers < 1000000) return '100k_1m';
    return '1m_plus';
  }
}
