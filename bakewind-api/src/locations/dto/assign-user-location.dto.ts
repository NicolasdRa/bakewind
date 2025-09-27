import { createZodDto } from 'nestjs-zod';
import { assignUserToLocationSchema } from '../locations.validation';

export class AssignUserToLocationDto extends createZodDto(
  assignUserToLocationSchema,
) {}
