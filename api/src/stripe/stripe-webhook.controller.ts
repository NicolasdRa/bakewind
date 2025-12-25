import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionPlansService } from '../subscriptions/subscription-plans.service';
// TODO: Replace with TenantsService after tenants module is implemented
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('stripe/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionPlansService: SubscriptionPlansService,
    // TODO: Inject TenantsService when implemented
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_dummy',
      {
        apiVersion: '2025-08-27.basil' as any,
      },
    );
    this.webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || 'whsec_dummy';
  }

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() // Hide from Swagger for security
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook signature or payload',
  })
  async handleStripeWebhook(
    @Body() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!this.webhookSecret) {
      this.logger.error('Stripe webhook secret not configured');
      throw new InternalServerErrorException('Webhook configuration error');
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );

      this.logger.log(`Received Stripe webhook: ${event.type} (${event.id})`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Webhook signature verification failed:', errorMessage);
      throw new BadRequestException('Invalid webhook signature');
    }

    try {
      // Process webhook event
      await this.processWebhookEvent(event);

      this.logger.log(
        `Successfully processed webhook: ${event.type} (${event.id})`,
      );
      return { received: true, eventId: event.id };
    } catch (error) {
      this.logger.error(
        `Failed to process webhook ${event.type} (${event.id}):`,
        error,
      );
      throw new InternalServerErrorException('Webhook processing failed');
    }
  }

  private async processWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      // Subscription lifecycle events
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      // Trial events
      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object);
        break;

      // Payment events
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;

      default:
        this.logger.warn(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(`Processing subscription created: ${subscription.id}`);

    // TODO: Implement with TenantsService
    // This handler needs to be updated to work with the new tenants table
    // instead of saas_users. The logic should:
    // 1. Find tenant by Stripe customer ID
    // 2. Update tenant subscription status
    // 3. Mark trial as converted if applicable
    this.logger.warn(
      'handleSubscriptionCreated: Needs TenantsService implementation',
    );
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(`Processing subscription updated: ${subscription.id}`);

    // TODO: Implement with TenantsService
    // Find tenant by Stripe subscription ID and update subscription details
    this.logger.warn(
      'handleSubscriptionUpdated: Needs TenantsService implementation',
    );
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(`Processing subscription deleted: ${subscription.id}`);

    // TODO: Implement with TenantsService
    // Find tenant by Stripe subscription ID and mark as canceled
    this.logger.warn(
      'handleSubscriptionDeleted: Needs TenantsService implementation',
    );
  }

  private async handleTrialWillEnd(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(`Processing trial will end: ${subscription.id}`);

    // TODO: Implement with TenantsService
    // Find tenant by Stripe subscription ID and send trial ending notification
    this.logger.warn(
      'handleTrialWillEnd: Needs TenantsService implementation',
    );
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Processing payment succeeded: ${invoice.id}`);

    // TODO: Implement with TenantsService
    // Find tenant by Stripe subscription ID and record successful payment
    this.logger.warn(
      'handlePaymentSucceeded: Needs TenantsService implementation',
    );
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Processing payment failed: ${invoice.id}`);

    // TODO: Implement with TenantsService
    // Find tenant by Stripe subscription ID and update status if payment failed multiple times
    this.logger.warn(
      'handlePaymentFailed: Needs TenantsService implementation',
    );
  }
}
