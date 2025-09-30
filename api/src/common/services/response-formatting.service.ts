import { Injectable, Logger } from '@nestjs/common';
import { ResponseCode } from '../constants/response-codes.constants';

@Injectable()
export class ResponseFormattingService {
  private readonly logger = new Logger(ResponseFormattingService.name);

  /**
   * Creates a standardized success response
   * @param data The data to include in the response
   * @param entityType The type of entity being returned
   * @param action The action performed (retrieved, created, updated, etc.)
   * @returns Formatted success response
   */
  createSuccessResponse<T>(
    data: T,
    entityType: string,
    action = 'retrieved',
  ): any {
    // Only treat arrays as empty if they have no elements
    // For non-arrays, only treat as empty for 'retrieved' actions when data is null/undefined
    const isEmpty = Array.isArray(data)
      ? data.length === 0
      : !data && action === 'retrieved';

    return {
      status: ResponseCode.SUCCESS,
      message: isEmpty
        ? `No ${entityType} found`
        : `${entityType} ${action} successfully`,
      data: data,
    };
  }
}
