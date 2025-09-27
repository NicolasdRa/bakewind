import { createZodDto } from 'nestjs-zod';
import { userUpdateSchema } from '../users.validation';

export class UpdateUserDto extends createZodDto(userUpdateSchema) {}
