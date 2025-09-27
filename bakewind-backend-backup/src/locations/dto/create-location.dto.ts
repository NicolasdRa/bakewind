import { createZodDto } from 'nestjs-zod';
import { createLocationSchema } from '../locations.validation';

export class CreateLocationDto extends createZodDto(createLocationSchema) {}
