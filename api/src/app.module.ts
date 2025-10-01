import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { APP_GUARD } from '@nestjs/core';
import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SaasUsersModule } from './saas-users/saas-users.module';
import { LocationsModule } from './locations/locations.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FeaturesModule } from './features/features.module';
import { TrialsModule } from './trials/trials.module';
import { CustomersModule } from './customers/customers.module';
import { UserSessionsModule } from './user-sessions/user-sessions.module';
import { StripeModule } from './stripe/stripe.module';
import { WidgetsModule } from './widgets/widgets.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

import configuration, { AppConfig } from './config/configuration';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const appConfig = configService.get<AppConfig>('app')!;
        return [
          {
            name: 'short',
            ttl: appConfig.rateLimit.ttl,
            limit: appConfig.rateLimit.limit,
          },
          {
            name: 'long',
            ttl: 3600000, // 1 hour
            limit: 1000,
          },
        ];
      },
    }),

    // Feature modules
    DatabaseModule,
    AuthModule,
    UsersModule,
    SaasUsersModule,
    LocationsModule,
    SubscriptionsModule,
    FeaturesModule,
    TrialsModule,
    CustomersModule,
    UserSessionsModule,
    StripeModule,
    WidgetsModule,
    HealthModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
