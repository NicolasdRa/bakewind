import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { OrderLocksService } from './order-locks.service';
import { acquireLockSchema, AcquireLockDto } from './dto/acquire-lock.dto';

@ApiTags('order-locks')
@Controller('api/v1/order-locks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderLocksController {
  constructor(private readonly orderLocksService: OrderLocksService) {}

  @Post('acquire')
  @ApiOperation({ summary: 'Acquire lock on an order' })
  @ApiResponse({ status: 200, description: 'Lock acquired successfully' })
  @ApiResponse({
    status: 409,
    description: 'Order already locked by another user',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async acquireLock(
    @Request() req: { user: { userId: string } },
    @Body(new ZodValidationPipe(acquireLockSchema)) dto: AcquireLockDto,
  ) {
    return this.orderLocksService.acquireLock(req.user.userId, dto);
  }

  @Delete('release/:orderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Release lock on an order' })
  @ApiResponse({ status: 204, description: 'Lock released successfully' })
  @ApiResponse({
    status: 404,
    description: 'No lock found or not owned by current user',
  })
  @ApiResponse({ status: 400, description: 'Invalid order ID format' })
  async releaseLock(
    @Request() req: { user: { userId: string } },
    @Param('orderId', new ParseUUIDPipe({ errorHttpStatusCode: 400 }))
    orderId: string,
  ) {
    await this.orderLocksService.releaseLock(req.user.userId, orderId);
  }

  @Post('renew/:orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renew lock on an order' })
  @ApiResponse({ status: 200, description: 'Lock renewed' })
  @ApiResponse({ status: 404, description: 'Lock not found or expired' })
  @ApiResponse({ status: 400, description: 'Invalid order ID format' })
  async renewLock(
    @Request() req: { user: { userId: string } },
    @Param('orderId', new ParseUUIDPipe({ errorHttpStatusCode: 400 }))
    orderId: string,
  ) {
    return this.orderLocksService.renewLock(req.user.userId, orderId);
  }

  @Get('status/:orderId')
  @ApiOperation({ summary: 'Check lock status of an order' })
  @ApiResponse({ status: 200, description: 'Lock status retrieved' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Invalid order ID format' })
  async getLockStatus(
    @Param('orderId', new ParseUUIDPipe({ errorHttpStatusCode: 400 }))
    orderId: string,
  ) {
    return this.orderLocksService.getLockStatus(orderId);
  }
}
