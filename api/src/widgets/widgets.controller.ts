import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { WidgetsService } from './widgets.service';
import {
  updateWidgetConfigSchema,
  UpdateWidgetConfigDto,
} from './dto/widget-config.dto';

@ApiTags('widgets')
@Controller('api/v1/widgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get user widget configuration' })
  @ApiResponse({
    status: 200,
    description: 'Widget configuration retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Widget configuration not found (first-time user)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getConfig(@Request() req: { user: { userId: string } }) {
    return this.widgetsService.getConfig(req.user.userId);
  }

  @Put('config')
  @ApiOperation({ summary: 'Update user widget configuration' })
  @ApiResponse({
    status: 200,
    description: 'Widget configuration updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (e.g., >20 widgets)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateConfig(
    @Request() req: { user: { userId: string } },
    @Body(new ZodValidationPipe(updateWidgetConfigSchema))
    dto: UpdateWidgetConfigDto,
  ) {
    return this.widgetsService.updateConfig(req.user.userId, dto);
  }
}
