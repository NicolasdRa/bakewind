import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [ConfigModule],
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