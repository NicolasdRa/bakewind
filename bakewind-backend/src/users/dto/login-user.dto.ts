import { createZodDto } from 'nestjs-zod';
import { userLoginSchema } from '../users.validation';

export class LoginUserDto extends createZodDto(userLoginSchema) {}
