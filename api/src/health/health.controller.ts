import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './health-reponse.dto';
import { ResponseFormattingService } from '../common/services/response-formatting.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly responseFormattingService: ResponseFormattingService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Check API health status' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    type: HealthResponseDto,
  })
  @Get()
  public getHealthStatus(): HealthResponseDto {
    const data = {
      status: 'UP',
      timestamp: new Date().toISOString(),
    };

    return this.responseFormattingService.createSuccessResponse(
      data,
      'Health status',
      'retrieved',
    );
  }
}
