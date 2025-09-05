import { Logger as NestLogger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export class Logger extends NestLogger {
  private correlationId: string;

  constructor(context?: string) {
    super(context || 'Logger');
    this.correlationId = randomUUID();
  }

  setCorrelationId(correlationId: string) {
    this.correlationId = correlationId;
  }

  getCorrelationId(): string {
    return this.correlationId;
  }

  private formatMessage(message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${contextStr} [${this.correlationId}] ${message}`;
  }

  log(message: string, context?: string) {
    super.log(this.formatMessage(message, context));
  }

  error(message: string, trace?: string, context?: string) {
    super.error(this.formatMessage(message, context), trace);
  }

  warn(message: string, context?: string) {
    super.warn(this.formatMessage(message, context));
  }

  debug(message: string, context?: string) {
    super.debug(this.formatMessage(message, context));
  }

  verbose(message: string, context?: string) {
    super.verbose(this.formatMessage(message, context));
  }
}

export const createLogger = (context?: string): Logger => {
  return new Logger(context);
};
