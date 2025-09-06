import { ConsoleLogger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export class Logger extends ConsoleLogger {
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

  private formatLogMessage(message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${contextStr} [${this.correlationId}] ${message}`;
  }

  log(message: string, context?: string) {
    super.log(this.formatLogMessage(message, context));
  }

  error(message: string, trace?: string, context?: string) {
    super.error(this.formatLogMessage(message, context), trace);
  }

  warn(message: string, context?: string) {
    super.warn(this.formatLogMessage(message, context));
  }

  debug(message: string, context?: string) {
    super.debug(this.formatLogMessage(message, context));
  }

  verbose(message: string, context?: string) {
    super.verbose(this.formatLogMessage(message, context));
  }
}

export const createLogger = (context?: string): Logger => {
  return new Logger(context);
};
