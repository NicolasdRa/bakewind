/**
 * Pricing Plans Component for BakeWind SaaS Customer Portal
 *
 * Displays subscription plans with pricing, features, and call-to-action buttons.
 * Connects to the backend API for dynamic plan loading.
 */

import { createSignal, createResource, For, Show } from 'solid-js';
import { subscriptionApi } from '../lib/api-client';
import { SubscriptionPlan } from '../types/api.types';

export default function PricingPlans() {
  const [billingCycle, setBillingCycle] = createSignal<'monthly' | 'annual'>('monthly');

  // Fetch subscription plans from API
  const [plansData] = createResource(async () => {
    try {
      const response = await subscriptionApi.getPlans();
      return response.data.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sortOrder - b.sortOrder);
    } catch (error) {
      console.error('Failed to load subscription plans:', error);
      return [];
    }
  });

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(0);
  };

  const getAnnualSavings = (monthly: number, annual: number) => {
    const monthlyYearly = monthly * 12;
    const savings = ((monthlyYearly - annual) / monthlyYearly) * 100;
    return Math.round(savings);
  };

  return (
    <section class="pricing-plans">
      <div class="pricing-plans__container">
        {/* Header */}
        <div class="pricing-plans__header">
          <h2 class="pricing-plans__title">
            Choose the perfect plan for your bakery
          </h2>
          <p class="pricing-plans__subtitle">
            Start your 14-day free trial on any plan. No credit card required.
          </p>

          {/* Billing Toggle */}
          <div class="pricing-plans__billing-toggle">
            <label class="pricing-plans__toggle-label">
              <input
                type="radio"
                name="billing"
                value="monthly"
                checked={billingCycle() === 'monthly'}
                onChange={() => setBillingCycle('monthly')}
                class="sr-only"
              />
              <span class="pricing-plans__toggle-option" classList={{ 'pricing-plans__toggle-option--active': billingCycle() === 'monthly' }}>
                Monthly
              </span>
            </label>
            <label class="pricing-plans__toggle-label">
              <input
                type="radio"
                name="billing"
                value="annual"
                checked={billingCycle() === 'annual'}
                onChange={() => setBillingCycle('annual')}
                class="sr-only"
              />
              <span class="pricing-plans__toggle-option" classList={{ 'pricing-plans__toggle-option--active': billingCycle() === 'annual' }}>
                Annual
                <span class="pricing-plans__savings-badge">Save up to 20%</span>
              </span>
            </label>
          </div>
        </div>

        {/* Plans Grid */}
        <div class="pricing-plans__grid">
          <Show when={!plansData.loading} fallback={
            <div class="pricing-plans__loading">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-saas-500"></div>
              <span class="text-neutral-600 ml-3">Loading plans...</span>
            </div>
          }>
            <For each={plansData()}>
              {(plan: SubscriptionPlan) => {
                const price = billingCycle() === 'monthly' ? plan.priceMonthlyUsd : plan.priceAnnualUsd;
                const savings = getAnnualSavings(plan.priceMonthlyUsd, plan.priceAnnualUsd);

                return (
                  <div
                    class="pricing-plans__card"
                    classList={{
                      'pricing-plans__card--popular': plan.isPopular
                    }}
                  >
                    {/* Popular Badge */}
                    <Show when={plan.isPopular}>
                      <div class="pricing-plans__popular-badge">
                        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Most Popular
                      </div>
                    </Show>

                    {/* Plan Header */}
                    <div class="pricing-plans__plan-header">
                      <h3 class="pricing-plans__plan-name">{plan.name}</h3>
                      <p class="pricing-plans__plan-description">{plan.description}</p>
                    </div>

                    {/* Pricing */}
                    <div class="pricing-plans__pricing">
                      <div class="pricing-plans__price">
                        <span class="pricing-plans__currency">$</span>
                        <span class="pricing-plans__amount">{formatPrice(price)}</span>
                        <span class="pricing-plans__period">
                          /{billingCycle() === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                      <Show when={billingCycle() === 'annual' && savings > 0}>
                        <div class="pricing-plans__annual-savings">
                          Save {savings}% annually
                        </div>
                      </Show>
                    </div>

                    {/* Features */}
                    <div class="pricing-plans__features">
                      <div class="pricing-plans__limits">
                        <Show when={plan.maxLocations}>
                          <div class="pricing-plans__limit">
                            <svg class="pricing-plans__limit-icon" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                            </svg>
                            <span>
                              {plan.maxLocations === 1 ? '1 location' : `Up to ${plan.maxLocations} locations`}
                            </span>
                          </div>
                        </Show>
                        <Show when={plan.maxUsers}>
                          <div class="pricing-plans__limit">
                            <svg class="pricing-plans__limit-icon" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                            </svg>
                            <span>
                              {plan.maxUsers === 1 ? '1 user' : `Up to ${plan.maxUsers} users`}
                            </span>
                          </div>
                        </Show>
                      </div>

                      <div class="pricing-plans__feature-list">
                        <h4 class="pricing-plans__features-title">Features included:</h4>
                        <ul class="pricing-plans__features-items">
                          <For each={plan.features}>
                            {(feature) => (
                              <li class="pricing-plans__feature-item">
                                <svg class="pricing-plans__feature-check" viewBox="0 0 20 20" fill="currentColor">
                                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                <span>{feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                              </li>
                            )}
                          </For>
                        </ul>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div class="pricing-plans__cta">
                      <a
                        href="/trial-signup"
                        class="pricing-plans__cta-button"
                        classList={{
                          'pricing-plans__cta-button--primary': plan.isPopular,
                          'pricing-plans__cta-button--secondary': !plan.isPopular
                        }}
                      >
                        Start Free Trial
                        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                      </a>
                      <p class="pricing-plans__trial-note">
                        14-day free trial • No credit card required
                      </p>
                    </div>
                  </div>
                );
              }}
            </For>
          </Show>
        </div>

        {/* FAQ or Additional Info */}
        <div class="pricing-plans__footer">
          <div class="pricing-plans__footer-content">
            <h3 class="pricing-plans__footer-title">
              All plans include a 14-day free trial
            </h3>
            <p class="pricing-plans__footer-description">
              Experience the full power of BakeWind with any plan. Switch or cancel anytime during your trial.
            </p>
            <div class="pricing-plans__footer-actions">
              <a href="/features" class="pricing-plans__footer-link">
                Compare all features →
              </a>
              <a href="/contact" class="pricing-plans__footer-link">
                Need a custom plan? Contact us →
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pricing-plans {
          @apply py-16 bg-white;
        }

        .pricing-plans__container {
          @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
        }

        .pricing-plans__header {
          @apply text-center mb-12;
        }

        .pricing-plans__title {
          @apply text-4xl font-bold text-neutral-900 mb-4;
        }

        .pricing-plans__subtitle {
          @apply text-xl text-neutral-600 max-w-2xl mx-auto mb-8;
        }

        .pricing-plans__billing-toggle {
          @apply inline-flex items-center bg-neutral-100 rounded-lg p-1;
        }

        .pricing-plans__toggle-label {
          @apply cursor-pointer;
        }

        .pricing-plans__toggle-option {
          @apply px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-neutral-700 relative;
        }

        .pricing-plans__toggle-option--active {
          @apply bg-white text-neutral-900 shadow-sm;
        }

        .pricing-plans__savings-badge {
          @apply absolute -top-6 left-1/2 transform -translate-x-1/2 bg-success-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap;
        }

        .pricing-plans__grid {
          @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16;
        }

        .pricing-plans__loading {
          @apply col-span-full flex items-center justify-center py-12;
        }

        .pricing-plans__card {
          @apply relative bg-white border border-neutral-200 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg;
        }

        .pricing-plans__card--popular {
          @apply ring-2 ring-saas-200 border-saas-300 transform scale-105;
        }

        .pricing-plans__popular-badge {
          @apply absolute -top-4 left-1/2 transform -translate-x-1/2 bg-saas-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1;
        }

        .pricing-plans__plan-header {
          @apply mb-6;
        }

        .pricing-plans__plan-name {
          @apply text-2xl font-bold text-neutral-900 mb-2;
        }

        .pricing-plans__plan-description {
          @apply text-neutral-600;
        }

        .pricing-plans__pricing {
          @apply mb-8 pb-6 border-b border-neutral-200;
        }

        .pricing-plans__price {
          @apply flex items-baseline space-x-1;
        }

        .pricing-plans__currency {
          @apply text-2xl font-semibold text-neutral-900;
        }

        .pricing-plans__amount {
          @apply text-5xl font-bold text-neutral-900;
        }

        .pricing-plans__period {
          @apply text-xl text-neutral-600;
        }

        .pricing-plans__annual-savings {
          @apply text-sm text-success-600 font-medium mt-2;
        }

        .pricing-plans__features {
          @apply mb-8;
        }

        .pricing-plans__limits {
          @apply space-y-3 mb-6 pb-6 border-b border-neutral-100;
        }

        .pricing-plans__limit {
          @apply flex items-center space-x-3 text-neutral-700;
        }

        .pricing-plans__limit-icon {
          @apply w-5 h-5 text-saas-500;
        }

        .pricing-plans__features-title {
          @apply text-sm font-semibold text-neutral-900 mb-4;
        }

        .pricing-plans__features-items {
          @apply space-y-3;
        }

        .pricing-plans__feature-item {
          @apply flex items-start space-x-3 text-neutral-700;
        }

        .pricing-plans__feature-check {
          @apply w-5 h-5 text-success-500 flex-shrink-0 mt-0.5;
        }

        .pricing-plans__cta {
          @apply text-center;
        }

        .pricing-plans__cta-button {
          @apply w-full inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200;
        }

        .pricing-plans__cta-button--primary {
          @apply bg-saas-500 text-white hover:bg-saas-600;
        }

        .pricing-plans__cta-button--secondary {
          @apply bg-neutral-100 text-neutral-900 hover:bg-neutral-200;
        }

        .pricing-plans__trial-note {
          @apply text-sm text-neutral-500 mt-3;
        }

        .pricing-plans__footer {
          @apply bg-neutral-50 rounded-2xl p-8 text-center;
        }

        .pricing-plans__footer-content {
          @apply max-w-2xl mx-auto;
        }

        .pricing-plans__footer-title {
          @apply text-2xl font-bold text-neutral-900 mb-4;
        }

        .pricing-plans__footer-description {
          @apply text-neutral-600 mb-6;
        }

        .pricing-plans__footer-actions {
          @apply flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-6;
        }

        .pricing-plans__footer-link {
          @apply text-saas-600 hover:text-saas-700 font-medium transition-colors duration-200;
        }
      `}</style>
    </section>
  );
}