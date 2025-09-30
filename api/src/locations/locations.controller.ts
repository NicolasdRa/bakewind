import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateLocationDto,
  UpdateLocationDto,
  AssignUserToLocationDto,
  LocationResponseData,
  LocationQueryParams,
  createLocationSchema,
  updateLocationSchema,
  assignUserToLocationSchema,
  locationQuerySchema,
} from './locations.validation';

@ApiTags('Locations')
@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({
    status: 201,
    description: 'Location created successfully',
    type: Object,
  })
  @ApiResponse({
    status: 409,
    description: 'Location with this name already exists in the city',
  })
  async create(
    @Body(new ZodValidationPipe(createLocationSchema))
    createLocationDto: CreateLocationDto,
  ): Promise<LocationResponseData> {
    return this.locationsService.create(createLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations with optional filters' })
  @ApiQuery({ name: 'isActive', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of locations',
    type: [Object],
  })
  async findAll(
    @Query(new ZodValidationPipe(locationQuerySchema))
    query: LocationQueryParams,
  ): Promise<LocationResponseData[]> {
    return this.locationsService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active locations' })
  @ApiResponse({
    status: 200,
    description: 'List of active locations',
    type: [Object],
  })
  async findActiveLocations(): Promise<LocationResponseData[]> {
    return this.locationsService.findAll({ isActive: true });
  }

  @Get('my-locations')
  @ApiOperation({ summary: 'Get current user assigned locations' })
  @ApiResponse({
    status: 200,
    description: 'List of user assigned locations',
    type: [Object],
  })
  async getMyLocations(
    @CurrentUser('id') userId: string,
  ): Promise<LocationResponseData[]> {
    console.log(
      '🎯 [LOCATIONS_CONTROLLER] GET /my-locations called for user:',
      userId,
    );
    const locations = await this.locationsService.getUserLocations(userId);
    console.log(
      '🎯 [LOCATIONS_CONTROLLER] Returning locations:',
      locations.length,
    );
    return locations;
  }

  @Get('my-default-location')
  @ApiOperation({ summary: 'Get current user default location' })
  @ApiResponse({
    status: 200,
    description: 'User default location',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'No default location found',
  })
  async getMyDefaultLocation(
    @CurrentUser('id') userId: string,
  ): Promise<LocationResponseData | null> {
    return this.locationsService.getUserDefaultLocation(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Location found',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  async findOne(@Param('id') id: string): Promise<LocationResponseData> {
    return this.locationsService.findById(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update location by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Location with this name already exists in the city',
  })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLocationSchema))
    updateLocationDto: UpdateLocationDto,
  ): Promise<LocationResponseData> {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete location (soft delete)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({
    status: 204,
    description: 'Location deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.locationsService.remove(id);
  }

  // User-Location assignment endpoints
  @Post(':id/assign-user')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Assign user to location' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'User assigned to location successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  @ApiResponse({
    status: 409,
    description: 'User is already assigned to this location',
  })
  async assignUser(
    @Param('id') locationId: string,
    @Body(
      new ZodValidationPipe(
        assignUserToLocationSchema.omit({ locationId: true }),
      ),
    )
    assignmentData: Omit<AssignUserToLocationDto, 'locationId'>,
  ): Promise<{ message: string }> {
    await this.locationsService.assignUserToLocation({
      ...assignmentData,
      locationId,
    });
    return { message: 'User assigned to location successfully' };
  }

  @Delete(':id/users/:userId')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove user from location' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 204,
    description: 'User removed from location successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Location or user assignment not found',
  })
  async removeUserFromLocation(
    @Param('id') locationId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    await this.locationsService.removeUserFromLocation(userId, locationId);
  }

  @Get(':id/users')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get users assigned to location' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'List of user IDs assigned to location',
    type: [String],
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  async getLocationUsers(@Param('id') locationId: string): Promise<string[]> {
    return this.locationsService.getLocationUsers(locationId);
  }
}
