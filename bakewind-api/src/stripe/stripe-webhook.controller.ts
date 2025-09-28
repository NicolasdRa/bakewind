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
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionPlansService } from '../subscriptions/subscription-plans.service';
import { TrialAccountsService } from '../trials/trial-accounts.service';
import { SaasUsersService } from '../saas-users/saas-users.service';
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
    private readonly trialAccountsService: TrialAccountsService,
    private readonly saasUsersService: SaasUsersService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
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
      this.logger.error('Webhook signature verification failed:', error.message);
      throw new BadRequestException('Invalid webhook signature');
    }

    try {
      // Process webhook event
      await this.processWebhookEvent(event);

      this.logger.log(`Successfully processed webhook: ${event.type} (${event.id})`);
      return { received: true, eventId: event.id };
    } catch (error) {
      this.logger.error(`Failed to process webhook ${event.type} (${event.id}):`, error);
      throw new InternalServerErrorException('Webhook processing failed');
    }
  }

  private async processWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      // Subscription lifecycle events
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      // Trial events
      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      // Payment events
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.warn(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Processing subscription created: ${subscription.id}`);

    try {
      const customerId = subscription.customer as string;
      const priceId = subscription.items.data[0]?.price.id;

      if (!priceId) {
        throw new Error('No price ID found in subscription');
      }

      // Find the plan by Stripe price ID
      const plan = await this.subscriptionPlansService.getPlanByStripePriceId(priceId);
      if (!plan) {
        throw new Error(`No plan found for Stripe price ID: ${priceId}`);
      }

      // Find user by Stripe customer ID
      const user = await this.saasUsersService.getUserByStripeCustomerId(customerId);
      if (!user) {
        throw new Error(`No user found for Stripe customer ID: ${customerId}`);
      }

      // Update user subscription status
      await this.saasUsersService.updateSubscription(user.id, {
        subscriptionStatus: subscription.status === 'active' ? 'active' : 'pending',
        stripeSubscriptionId: subscription.id,
        subscriptionPlanId: plan.id,
        subscriptionStartDate: new Date(subscription.current_period_start * 1000),
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
      });

      // If user was on trial, mark trial as converted
      const trial = await this.trialAccountsService.getTrialByUserId(user.id);
      if (trial && !trial.hasConvertedToPaid) {
        await this.trialAccountsService.convertToPaid(trial.id, plan.id);
      }

      this.logger.log(`Subscription created successfully for user ${user.id}`);
    } catch (error) {
      this.logger.error('Failed to process subscription created:', error);
      throw error;
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Processing subscription updated: ${subscription.id}`);

    try {
      const user = await this.saasUsersService.getUserByStripeSubscriptionId(subscription.id);
      if (!user) {
        this.logger.warn(`No user found for subscription ID: ${subscription.id}`);
        return;
      }

      const priceId = subscription.items.data[0]?.price.id;
      let planId = user.subscriptionPlanId;

      // Check if plan changed
      if (priceId) {
        const plan = await this.subscriptionPlansService.getPlanByStripePriceId(priceId);
        if (plan) {
          planId = plan.id;
        }
      }

      // Update subscription details
      await this.saasUsersService.updateSubscription(user.id, {
        subscriptionStatus: this.mapStripeStatusToInternal(subscription.status),
        subscriptionPlanId: planId,
        subscriptionStartDate: new Date(subscription.current_period_start * 1000),
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
      });

      this.logger.log(`Subscription updated successfully for user ${user.id}`);
    } catch (error) {
      this.logger.error('Failed to process subscription updated:', error);
      throw error;
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Processing subscription deleted: ${subscription.id}`);

    try {
      const user = await this.saasUsersService.getUserByStripeSubscriptionId(subscription.id);
      if (!user) {
        this.logger.warn(`No user found for subscription ID: ${subscription.id}`);
        return;
      }

      // Update user to canceled status
      await this.saasUsersService.updateSubscription(user.id, {
        subscriptionStatus: 'canceled',
        subscriptionEndDate: new Date(),
      });

      this.logger.log(`Subscription canceled for user ${user.id}`);
    } catch (error) {
      this.logger.error('Failed to process subscription deleted:', error);
      throw error;
    }
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Processing trial will end: ${subscription.id}`);

    try {
      const user = await this.saasUsersService.getUserByStripeSubscriptionId(subscription.id);
      if (!user) {
        this.logger.warn(`No user found for subscription ID: ${subscription.id}`);
        return;
      }

      // Send trial ending notification (implement email service)
      // await this.emailService.sendTrialEndingNotification(user);

      this.logger.log(`Trial ending notification processed for user ${user.id}`);
    } catch (error) {
      this.logger.error('Failed to process trial will end:', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Processing payment succeeded: ${invoice.id}`);

    try {
      const subscriptionId = invoice.subscription as string;
      if (!subscriptionId) {
        this.logger.warn(`No subscription ID in invoice: ${invoice.id}`);
        return;
      }

      const user = await this.saasUsersService.getUserByStripeSubscriptionId(subscriptionId);
      if (!user) {
        this.logger.warn(`No user found for subscription ID: ${subscriptionId}`);
        return;
      }

      // Update last payment date
      await this.saasUsersService.updateUser(user.id, {
        lastPaymentDate: new Date(invoice.status_transitions.paid_at * 1000),
      });

      // Send payment confirmation (implement email service)
      // await this.emailService.sendPaymentConfirmation(user, invoice);

      this.logger.log(`Payment success processed for user ${user.id}`);
    } catch (error) {
      this.logger.error('Failed to process payment succeeded:', error);
      throw error;
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Processing payment failed: ${invoice.id}`);

    try {
      const subscriptionId = invoice.subscription as string;
      if (!subscriptionId) {
        this.logger.warn(`No subscription ID in invoice: ${invoice.id}`);
        return;
      }

      const user = await this.saasUsersService.getUserByStripeSubscriptionId(subscriptionId);
      if (!user) {
        this.logger.warn(`No user found for subscription ID: ${subscriptionId}`);
        return;
      }

      // Update subscription status if needed
      if (invoice.attempt_count >= 3) {
        await this.saasUsersService.updateSubscription(user.id, {
          subscriptionStatus: 'past_due',
        });
      }

      // Send payment failure notification (implement email service)
      // await this.emailService.sendPaymentFailedNotification(user, invoice);

      this.logger.log(`Payment failure processed for user ${user.id}`);
    } catch (error) {
      this.logger.error('Failed to process payment failed:', error);
      throw error;
    }
  }

  private mapStripeStatusToInternal(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      'active': 'active',
      'trialing': 'trial',
      'past_due': 'past_due',
      'canceled': 'canceled',
      'unpaid': 'past_due',
      'incomplete': 'pending',
      'incomplete_expired': 'canceled',
    };

    return statusMap[stripeStatus] || 'unknown';
  }
}