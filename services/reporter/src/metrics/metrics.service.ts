import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private metrics = {
    reportsGenerated: 0,
    reportGenerationTimes: [] as number[],
  };

  recordReportGenerated(reportType: string): void {
    this.metrics.reportsGenerated++;
    console.log(`[METRICS] Generated report: ${reportType} (total: ${this.metrics.reportsGenerated})`);
  }

  recordReportGenerationTime(reportType: string, duration: number): void {
    this.metrics.reportGenerationTimes.push(duration);
    if (this.metrics.reportGenerationTimes.length > 1000) {
      this.metrics.reportGenerationTimes = this.metrics.reportGenerationTimes.slice(-1000);
    }
    console.log(`[METRICS] Report generation time: ${reportType} - ${duration}ms`);
  }

  getMetrics() {
    const avgGenerationTime = this.metrics.reportGenerationTimes.length > 0 
      ? this.metrics.reportGenerationTimes.reduce((a, b) => a + b, 0) / this.metrics.reportGenerationTimes.length 
      : 0;

    return {
      reportsGenerated: this.metrics.reportsGenerated,
      averageGenerationTime: avgGenerationTime,
    };
  }
}