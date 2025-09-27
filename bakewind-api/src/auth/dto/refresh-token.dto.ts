import { createZodDto } from 'nestjs-zod';
import { refreshTokenRequestSchema } from '../auth.validation';

export class RefreshTokenDto extends createZodDto(refreshTokenRequestSchema) {}
