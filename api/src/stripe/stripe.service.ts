import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @Inject('STRIPE') private readonly stripe: Stripe,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a Stripe customer for a trial user
   */
  async createCustomer(
    email: string,
    name: string,
    businessName?: string,
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          businessName: businessName || '',
          source: 'bakewind_trial_signup',
        },
      });

      this.logger.log(`Created Stripe customer ${customer.id} for ${email}`);
      return customer;
    } catch (error) {
      this.logger.error(
        `Failed to create Stripe customer for ${email}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    billingCycle: 'monthly' | 'annual' = 'monthly',
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          billingCycle,
          source: 'bakewind_trial_conversion',
        },
      });

      this.logger.log(
        `Created subscription ${subscription.id} for customer ${customerId}`,
      );
      return subscription;
    } catch (error) {
      this.logger.error(
        `Failed to create subscription for customer ${customerId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create a checkout session for subscription upgrade
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        metadata: {
          source: 'bakewind_trial_conversion',
        },
      });

      this.logger.log(
        `Created checkout session ${session.id} for customer ${customerId}`,
      );
      return session;
    } catch (error) {
      this.logger.error(
        `Failed to create checkout session for customer ${customerId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription =
        await this.stripe.subscriptions.cancel(subscriptionId);
      this.logger.log(`Canceled subscription ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription ${subscriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Retrieve subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve subscription ${subscriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Construct webhook event from raw body and signature
   */
  constructWebhookEvent(body: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error('Failed to construct webhook event:', error);
      throw error;
    }
  }

  /**
   * Handle subscription status changes from webhooks
   */
  async handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Handling Stripe event: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        this.logger.log(
          `Subscription ${subscription.id} status: ${subscription.status}`,
        );
        // TODO: Update database subscription status
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        this.logger.log(`Payment succeeded for invoice ${invoice.id}`);
        // TODO: Update database payment status
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        this.logger.log(`Payment failed for invoice ${failedInvoice.id}`);
        // TODO: Handle payment failure
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }
}
