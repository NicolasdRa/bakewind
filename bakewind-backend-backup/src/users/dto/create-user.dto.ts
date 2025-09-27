import { createZodDto } from 'nestjs-zod';
import { userRegistrationSchema } from '../users.validation';

export class CreateUserDto extends createZodDto(userRegistrationSchema) {}
