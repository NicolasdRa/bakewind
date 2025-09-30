import { createZodDto } from 'nestjs-zod';
import { updateLocationSchema } from '../locations.validation';

export class UpdateLocationDto extends createZodDto(updateLocationSchema) {}
