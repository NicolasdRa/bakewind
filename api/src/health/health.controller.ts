import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './health-reponse.dto';
import { ResponseFormattingService } from '../common/services/response-formatting.service';
import { Public } from '../auth/decorators/public.decorator';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly responseFormattingService: ResponseFormattingService,
    private readonly realtimeGateway: RealtimeGateway,
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

  @Public()
  @ApiOperation({ summary: 'Check WebSocket health status' })
  @ApiResponse({
    status: 200,
    description: 'WebSocket service status',
  })
  @Get('websocket')
  public async getWebSocketStatus() {
    const server = this.realtimeGateway.server;
    const isRunning = !!server;

    let connectedClients = 0;
    if (isRunning && server.sockets) {
      const sockets = await server.sockets.fetchSockets();
      connectedClients = sockets.length;
    }

    const data = {
      status: isRunning ? 'UP' : 'DOWN',
      service: 'WebSocket',
      connected_clients: connectedClients,
      timestamp: new Date().toISOString(),
    };

    return this.responseFormattingService.createSuccessResponse(
      data,
      'WebSocket health status',
      'retrieved',
    );
  }
}
