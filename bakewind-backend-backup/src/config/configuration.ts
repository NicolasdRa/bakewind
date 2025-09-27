import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  apiPrefix: z.string().default('api/v1'),
  database: z.object({
    url: z.string(),
    host: z.string(),
    port: z.coerce.number(),
    user: z.string(),
    password: z.string(),
    name: z.string(),
  }),
  jwt: z.object({
    secret: z.string(),
    expiresIn: z.string().default('24h'),
    refreshSecret: z.string(),
    refreshExpiresIn: z.string().default('7d'),
  }),
  cors: z.object({
    origin: z.string(),
    credentials: z.coerce.boolean().default(true),
  }),
  rateLimit: z.object({
    ttl: z.coerce.number().default(60000),
    limit: z.coerce.number().default(100),
  }),
  upload: z.object({
    maxFileSize: z.coerce.number().default(10485760),
    allowedTypes: z
      .string()
      .default('image/jpeg,image/png,image/webp,application/pdf'),
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    format: z.enum(['json', 'simple']).default('json'),
  }),
});

export type AppConfig = z.infer<typeof configSchema>;

export default registerAs('app', (): AppConfig => {
  const config = {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    apiPrefix: process.env.API_PREFIX,
    database: {
      url: process.env.DATABASE_URL,
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      name: process.env.DATABASE_NAME,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    },
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: process.env.CORS_CREDENTIALS,
    },
    rateLimit: {
      ttl: process.env.RATE_LIMIT_TTL,
      limit: process.env.RATE_LIMIT_LIMIT,
    },
    upload: {
      maxFileSize: process.env.MAX_FILE_SIZE,
      allowedTypes: process.env.ALLOWED_FILE_TYPES,
    },
    logging: {
      level: process.env.LOG_LEVEL,
      format: process.env.LOG_FORMAT,
    },
  };

  return configSchema.parse(config);
});
