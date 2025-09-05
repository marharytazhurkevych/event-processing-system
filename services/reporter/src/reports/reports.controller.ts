import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { reportFiltersSchema, ReportFiltersInput } from '@shared/utils';
import { Logger } from '@shared/utils';

@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger('ReportsController');

  constructor(private readonly reportsService: ReportsService) {}

  @Get('events')
  @HttpCode(HttpStatus.OK)
  async getEventStats(@Query() filters: ReportFiltersInput) {
    const requestCorrelationId = this.logger.getCorrelationId();
    this.logger.setCorrelationId(requestCorrelationId);

    try {
      const validatedFilters = reportFiltersSchema.parse(filters);
      const startTime = Date.now();
      
      const result = await this.reportsService.getEventStats(validatedFilters);
      
      const processingTime = Date.now() - startTime;
      this.logger.log(`Event stats report generated in ${processingTime}ms`, 'ReportsController');
      
      return {
        success: true,
        data: result,
        correlationId: requestCorrelationId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to generate event stats report: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: error.message,
        correlationId: requestCorrelationId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('revenue')
  @HttpCode(HttpStatus.OK)
  async getRevenueData(@Query() filters: ReportFiltersInput) {
    const requestCorrelationId = this.logger.getCorrelationId();
    this.logger.setCorrelationId(requestCorrelationId);

    try {
      const validatedFilters = reportFiltersSchema.parse(filters);
      const startTime = Date.now();
      
      const result = await this.reportsService.getRevenueData(validatedFilters);
      
      const processingTime = Date.now() - startTime;
      this.logger.log(`Revenue report generated in ${processingTime}ms`, 'ReportsController');
      
      return {
        success: true,
        data: result,
        correlationId: requestCorrelationId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to generate revenue report: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: error.message,
        correlationId: requestCorrelationId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('demographics')
  @HttpCode(HttpStatus.OK)
  async getDemographicsData(@Query() filters: ReportFiltersInput) {
    const requestCorrelationId = this.logger.getCorrelationId();
    this.logger.setCorrelationId(requestCorrelationId);

    try {
      const validatedFilters = reportFiltersSchema.parse(filters);
      const startTime = Date.now();
      
      const result = await this.reportsService.getDemographicsData(validatedFilters);
      
      const processingTime = Date.now() - startTime;
      this.logger.log(`Demographics report generated in ${processingTime}ms`, 'ReportsController');
      
      return {
        success: true,
        data: result,
        correlationId: requestCorrelationId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to generate demographics report: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: error.message,
        correlationId: requestCorrelationId,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
