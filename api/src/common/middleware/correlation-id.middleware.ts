import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorrelationIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    // Check if correlation ID is already present in headers
    let correlationId = req.headers['x-correlation-id'] as string;

    // If not present, generate a new one
    if (!correlationId) {
      correlationId = uuidv4();
    }

    // Attach correlation ID to request object
    req.correlationId = correlationId;

    // Add correlation ID to response headers
    res.setHeader('X-Correlation-ID', correlationId);

    // Log the request with correlation ID
    this.logger.log(
      `[${correlationId}] ${req.method} ${req.originalUrl} - ${req.ip}`,
    );

    // Continue to next middleware
    next();
  }
}