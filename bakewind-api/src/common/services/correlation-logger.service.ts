import { Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CorrelationLoggerService extends Logger {
  constructor(@Inject(REQUEST) private readonly request: Request) {
    super();
  }

  private formatMessage(message: any): string {
    const correlationId = this.request?.correlationId || 'no-correlation-id';
    return `[${correlationId}] ${message}`;
  }

  log(message: any, context?: string) {
    super.log(this.formatMessage(message), context);
  }

  error(message: any, trace?: string, context?: string) {
    super.error(this.formatMessage(message), trace, context);
  }

  warn(message: any, context?: string) {
    super.warn(this.formatMessage(message), context);
  }

  debug(message: any, context?: string) {
    super.debug(this.formatMessage(message), context);
  }

  verbose(message: any, context?: string) {
    super.verbose(this.formatMessage(message), context);
  }

  getCorrelationId(): string {
    return this.request?.correlationId || 'no-correlation-id';
  }
}