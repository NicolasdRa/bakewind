import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
// TrialsModule removed - merged into tenants
// SaasUsersModule removed - will be replaced by TenantsModule

@Module({
  imports: [ConfigModule, SubscriptionsModule],
  providers: [
    {
      provide: 'STRIPE',
      useFactory: (configService: ConfigService) => {
        const Stripe = require('stripe');
        return new Stripe(configService.get<string>('STRIPE_SECRET_KEY'), {
          apiVersion: '2023-10-16',
        });
      },
      inject: [ConfigService],
    },
    StripeService,
  ],
  controllers: [StripeWebhookController],
  exports: [StripeService],
})
export class StripeModule {}
