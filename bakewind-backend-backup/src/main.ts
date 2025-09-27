import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { join } from 'path';
import fastifyHelmet from '@fastify/helmet';

const swaggerDocumentOptions: SwaggerDocumentOptions = {
  operationIdFactory: (controllerKey: string, methodKey: string) => {
    return `${controllerKey}_${methodKey}`;
  },
  deepScanRoutes: true,
};

const swaggerCustomOptions: SwaggerCustomOptions = {
  jsonDocumentUrl: 'api/json',
};

async function bootstrap() {
  // Validate required environment variables on startup
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: true,
      logger: false, // Use NestJS logger instead
      bodyLimit: 10485760, // 10MB
    }),
  );

  // Configure security headers with Helmet
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Needed for Swagger UI
          "'unsafe-eval'", // Needed for Swagger UI
          'unpkg.com',
          'cdn.jsdelivr.net',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Needed for Swagger UI
          'unpkg.com',
          'cdn.jsdelivr.net',
          'fonts.googleapis.com',
        ],
        fontSrc: [
          "'self'",
          'fonts.gstatic.com',
          'data:', // For inline fonts
        ],
        imgSrc: [
          "'self'",
          'data:', // For inline images
          'validator.swagger.io', // Swagger UI validation
        ],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    dnsPrefetchControl: {
      allow: false,
    },
    ieNoOpen: true,
    permittedCrossDomainPolicies: false,
    hidePoweredBy: true,
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Patch Swagger for Zod compatibility
  patchNestJsSwagger();

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('BakeWind API')
    .setDescription(
      'API documentation for the BakeWind Bakery Management System',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('orders', 'Order management')
    .addTag('products', 'Product catalog')
    .addTag('inventory', 'Inventory management')
    .addTag('production', 'Production planning')
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
    swaggerDocumentOptions,
  );

  SwaggerModule.setup('api', app, document, swaggerCustomOptions);

  // Global validation pipe
  app.useGlobalPipes(new ZodValidationPipe());

  // Configure static assets without a prefix for cleaner URLs
  app.useStaticAssets({
    root: join(__dirname, '..', 'assets'),
    prefix: '/assets/',
    decorateReply: false,
    setHeaders: (res, path) => {
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (path.endsWith('.woff')) {
        res.setHeader('Content-Type', 'font/woff');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      } else if (path.endsWith('.woff2')) {
        res.setHeader('Content-Type', 'font/woff2');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      } else if (path.endsWith('.ttf')) {
        res.setHeader('Content-Type', 'font/ttf');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      } else if (path.endsWith('.otf')) {
        res.setHeader('Content-Type', 'font/otf');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    },
  });

  // Start server
  const port = process.env.PORT ?? 5000;
  await app.listen(port, '0.0.0.0');

  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
  Logger.log(`📚 Swagger documentation: http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  Logger.error('Error starting server:', err);
  process.exit(1);
});
