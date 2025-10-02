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
import fastifyCookie from '@fastify/cookie';

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

  // Configure cookie support
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || 'my-secret-key-change-in-production',
    parseOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  });

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

  // Enable CORS with environment-specific origins for SaaS applications
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:8080', // Reverse proxy (development)
    'http://localhost:3000', // Direct customer app (development)
    'http://localhost:3001', // Direct admin app (development)
    'http://localhost:3002', // SaaS customer portal (development)
    'https://customer.bakewind.com', // Customer app (production)
    'https://admin.bakewind.com', // Admin app (production)
    'https://portal.bakewind.com', // SaaS customer portal (production)
    'https://www.bakewind.com', // Main website (production)
    'https://bakewind.com', // Main website (production - apex domain)
  ];

  app.enableCors({
    origin: process.env.NODE_ENV === 'development' ? true : corsOrigins,
    credentials: true, // Enable cookies for refresh tokens and session management
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Cache-Control',
      'X-CSRF-Token',
      'X-User-Agent',
      'X-Session-ID',
      'X-Trial-ID',
      'X-Forwarded-Prefix',
      'X-Forwarded-Host',
      'X-Forwarded-Proto',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Correlation-ID',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
      'X-Trial-Days-Remaining',
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 hours preflight cache
  });

  // Patch Swagger for Zod compatibility
  patchNestJsSwagger();

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('BakeWind API')
    .setDescription(
      'API documentation for the BakeWind Bakery Management System\n\n' +
      'This API supports the three-application architecture:\n' +
      '- Customer-facing website (public orders, product browsing)\n' +
      '- Admin management system (staff operations, analytics)\n' +
      '- Central API service (all business logic and data)\n\n' +
      'All endpoints are prefixed with `/api/v1/` for versioning.',
    )
    .setVersion('1.0.0')
    .setTermsOfService('https://bakewind.com/terms')
    .setContact(
      'BakeWind Support',
      'https://bakewind.com/support',
      'support@bakewind.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3010', 'Development API Server')
    .addServer('https://api.bakewind.com', 'Production API Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management and profiles')
    .addTag('Subscriptions', 'SaaS subscription plans and billing')
    .addTag('Features', 'Software feature catalog and availability')
    .addTag('Trials', 'Trial account management and conversion')
    .addTag('Products', 'Product catalog and availability')
    .addTag('Orders', 'Order management and tracking')
    .addTag('Customers', 'Customer registration and management')
    .addTag('Inventory', 'Inventory tracking and management')
    .addTag('Production', 'Production planning and scheduling')
    .addTag('Analytics', 'Business analytics and reporting')
    .addTag('Locations', 'Store location management')
    .addTag('Health', 'System health and monitoring')
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
    swaggerDocumentOptions,
  );

  SwaggerModule.setup('api', app, document, swaggerCustomOptions);

  // Enable API versioning
  app.setGlobalPrefix('api/v1', {
    exclude: [
      'health',
      'health/(.*)',
      'api',
      'api/(.*)',
      'assets/(.*)',
    ],
  });

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
