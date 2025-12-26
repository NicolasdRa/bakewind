import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { APP_GUARD } from '@nestjs/core';
import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
// SaasUsersModule removed - merged into tenants
import { LocationsModule } from './locations/locations.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FeaturesModule } from './features/features.module';
// TrialsModule removed - merged into tenants
import { CustomersModule } from './customers/customers.module';
import { UserSessionsModule } from './user-sessions/user-sessions.module';
import { StripeModule } from './stripe/stripe.module';
import { WidgetsModule } from './widgets/widgets.module';
import { OrderLocksModule } from './order-locks/order-locks.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductsModule } from './products/products.module';
import { RecipesModule } from './recipes/recipes.module';
import { OrdersModule } from './orders/orders.module';
import { InternalOrdersModule } from './internal-orders/internal-orders.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ProductionModule } from './production/production.module';
import { StaffModule } from './staff/staff.module';
import { TenantsModule } from './tenants/tenants.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RedisModule } from './redis/redis.module';

import configuration, { AppConfig } from './config/configuration';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Redis module (global)
    RedisModule,

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

    // Task scheduling
    ScheduleModule.forRoot(),

    // Feature modules
    DatabaseModule,
    AuthModule,
    UsersModule,
    LocationsModule,
    SubscriptionsModule,
    FeaturesModule,
    CustomersModule,
    UserSessionsModule,
    StripeModule,
    WidgetsModule,
    OrderLocksModule,
    InventoryModule,
    ProductsModule,
    RecipesModule,
    OrdersModule,
    InternalOrdersModule,
    RealtimeModule,
    ProductionModule,
    StaffModule,
    TenantsModule,
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
