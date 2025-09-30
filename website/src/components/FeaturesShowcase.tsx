/**
 * Features Showcase Component for BakeWind SaaS Customer Portal
 *
 * A comprehensive display of software features with business benefits,
 * icons, and interactive elements for better engagement.
 */

import { createSignal, createResource, For, Show } from 'solid-js';
import { featuresApi } from '../lib/api-client';
import { SoftwareFeature } from '../types/api.types';
import FeatureIcon from './FeatureIcon/FeatureIcon';

// Map API feature categories to display categories for backwards compatibility
const categoryMapping = {
  'orders': 'operations',
  'inventory': 'operations',
  'production': 'operations',
  'products': 'operations',
  'analytics': 'analytics',
  'customers': 'customer',
} as const;

// Fallback benefits for features without detailed descriptions
const fallbackBenefits: Record<string, string[]> = {
  'orders': [
    'Track customer and internal orders in real-time',
    'Automated delivery schedule optimization',
    'Order status notifications and alerts',
    'Integration with production planning'
  ],
  'inventory': [
    'Real-time ingredient and supply tracking',
    'Automatic low-stock alerts and reorder points',
    'Supplier integration for seamless ordering',
    'Waste reduction through expiration tracking'
  ],
  'production': [
    'Intelligent production scheduling',
    'Recipe management and scaling',
    'Workforce allocation optimization',
    'Equipment utilization tracking'
  ],
  'analytics': [
    'Sales performance dashboards',
    'Product popularity analytics',
    'Operational efficiency metrics',
    'Custom report generation'
  ],
  'customers': [
    'Comprehensive customer profiles',
    'Order history and preferences tracking',
    'Loyalty program management',
    'Personalized marketing campaigns'
  ],
  'products': [
    'Dynamic pricing and seasonal menus',
    'Product images and descriptions',
    'Nutritional information tracking',
    'Special dietary categories'
  ]
};

// Transform API feature to component format
const transformFeature = (apiFeature: SoftwareFeature) => ({
  id: apiFeature.id,
  icon: apiFeature.iconName,
  title: apiFeature.name,
  description: apiFeature.description,
  benefits: fallbackBenefits[apiFeature.category] || [
    'Enhanced operational efficiency',
    'Streamlined workflows',
    'Improved data visibility',
    'Better decision making'
  ],
  category: categoryMapping[apiFeature.category] || apiFeature.category,
  isPopular: apiFeature.isHighlighted,
});

const categories = [
  { id: 'all', label: 'All Features' },
  { id: 'operations', label: 'Operations' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'customer', label: 'Customer' },
  { id: 'financial', label: 'Financial' },
];

export default function FeaturesShowcase() {
  const [selectedCategory, setSelectedCategory] = createSignal<string>('all');
  const [expandedFeature, setExpandedFeature] = createSignal<string | null>(null);

  // Fetch features from API
  const [featuresData] = createResource(async () => {
    try {
      const response = await featuresApi.getFeatures();
      return response.data.map(transformFeature);
    } catch (error) {
      console.error('Failed to load features:', error);
      return [];
    }
  });

  const filteredFeatures = () => {
    const features = featuresData() || [];
    const category = selectedCategory();
    if (category === 'all') return features;
    return features.filter(feature => feature.category === category);
  };

  const toggleFeature = (featureId: string) => {
    setExpandedFeature(prev => prev === featureId ? null : featureId);
  };

  return (
    <section class="features-showcase">
      <div class="features-showcase__container">
        {/* Header */}
        <div class="features-showcase__header">
          <h2 class="features-showcase__title">
            Everything you need to run your bakery
          </h2>
          <p class="features-showcase__subtitle">
            Comprehensive software features designed specifically for bakery operations,
            from small artisan shops to large commercial bakeries.
          </p>

          {/* Category Filter */}
          <div class="features-showcase__filters">
            <For each={categories}>
              {(category) => (
                <button
                  class="features-showcase__filter"
                  classList={{
                    'features-showcase__filter--active': selectedCategory() === category.id
                  }}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Features Grid */}
        <div class="features-showcase__grid">
          <Show when={!featuresData.loading} fallback={
            <div class="features-showcase__loading">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-saas-500"></div>
              <span class="text-neutral-600 ml-3">Loading features...</span>
            </div>
          }>
            <For each={filteredFeatures()}>
              {(feature) => (
              <div
                class="features-showcase__card card-elevated"
                classList={{
                  'features-showcase__card--popular': feature.isPopular,
                  'features-showcase__card--expanded': expandedFeature() === feature.id
                }}
              >
                {/* Popular Badge */}
                <Show when={feature.isPopular}>
                  <div class="features-showcase__popular-badge badge-info">
                    <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Most Popular
                  </div>
                </Show>

                {/* Feature Icon */}
                <div class="features-showcase__icon">
                  <FeatureIcon type={feature.icon} />
                </div>

                {/* Feature Content */}
                <div class="features-showcase__content">
                  <h3 class="features-showcase__feature-title">{feature.title}</h3>
                  <p class="features-showcase__feature-description">
                    {feature.description}
                  </p>

                  {/* Benefits List */}
                  <Show when={expandedFeature() === feature.id}>
                    <div class="features-showcase__benefits">
                      <h4 class="features-showcase__benefits-title">Key Benefits:</h4>
                      <ul class="features-showcase__benefits-list">
                        <For each={feature.benefits}>
                          {(benefit) => (
                            <li class="features-showcase__benefit-item">
                              <svg class="features-showcase__benefit-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                              </svg>
                              <span>{benefit}</span>
                            </li>
                          )}
                        </For>
                      </ul>
                    </div>
                  </Show>

                  {/* Toggle Button */}
                  <button
                    class="features-showcase__toggle"
                    onClick={() => toggleFeature(feature.id)}
                  >
                    <span>
                      {expandedFeature() === feature.id ? 'Show Less' : 'Learn More'}
                    </span>
                    <svg
                      class="features-showcase__toggle-icon"
                      classList={{ 'features-showcase__toggle-icon--rotated': expandedFeature() === feature.id }}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              )}
            </For>
          </Show>
        </div>

        {/* CTA Section */}
        <div class="features-showcase__cta">
          <div class="features-showcase__cta-content">
            <h3 class="features-showcase__cta-title">
              Ready to experience these features?
            </h3>
            <p class="features-showcase__cta-description">
              Start your 14-day free trial and see how BakeWind can transform your bakery operations.
            </p>
            <div class="features-showcase__cta-actions">
              <a href="/trial-signup" class="btn-primary">
                Start Free Trial
                <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </a>
              <a href="/pricing" class="btn-secondary">
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .features-showcase {
          @apply py-16 bg-neutral-50;
        }

        .features-showcase__container {
          @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
        }

        .features-showcase__header {
          @apply text-center mb-12;
        }

        .features-showcase__title {
          @apply text-4xl font-bold text-neutral-900 mb-4;
        }

        .features-showcase__subtitle {
          @apply text-xl text-neutral-600 max-w-3xl mx-auto mb-8;
        }

        .features-showcase__filters {
          @apply flex flex-wrap justify-center gap-2;
        }

        .features-showcase__filter {
          @apply px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 transition-all duration-200;
        }

        .features-showcase__filter:hover {
          @apply border-saas-300 text-saas-700;
        }

        .features-showcase__filter--active {
          @apply bg-saas-500 text-white border-saas-500;
        }

        .features-showcase__grid {
          @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16;
        }

        .features-showcase__loading {
          @apply col-span-full flex items-center justify-center py-12;
        }

        .features-showcase__card {
          @apply relative p-6 bg-white rounded-xl border border-neutral-200 transition-all duration-300;
        }

        .features-showcase__card--popular {
          @apply ring-2 ring-saas-200 border-saas-300;
        }

        .features-showcase__card--expanded {
          @apply lg:col-span-2;
        }

        .features-showcase__popular-badge {
          @apply absolute -top-3 left-4 px-3 py-1 text-xs font-medium flex items-center space-x-1;
        }

        .features-showcase__icon {
          @apply w-12 h-12 mb-4 text-saas-600;
        }

        .features-showcase__content {
          @apply space-y-4;
        }

        .features-showcase__feature-title {
          @apply text-lg font-semibold text-neutral-900;
        }

        .features-showcase__feature-description {
          @apply text-neutral-600 text-sm leading-relaxed;
        }

        .features-showcase__benefits {
          @apply mt-4 p-4 bg-neutral-50 rounded-lg;
        }

        .features-showcase__benefits-title {
          @apply text-sm font-medium text-neutral-900 mb-3;
        }

        .features-showcase__benefits-list {
          @apply space-y-2;
        }

        .features-showcase__benefit-item {
          @apply flex items-start space-x-2 text-sm text-neutral-700;
        }

        .features-showcase__benefit-icon {
          @apply w-4 h-4 text-success-600 flex-shrink-0 mt-0.5;
        }

        .features-showcase__toggle {
          @apply flex items-center justify-between w-full text-saas-600 hover:text-saas-700 transition-colors duration-200;
        }

        .features-showcase__toggle-icon {
          @apply w-4 h-4 transition-transform duration-200;
        }

        .features-showcase__toggle-icon--rotated {
          @apply rotate-180;
        }

        .features-showcase__cta {
          @apply bg-gradient-saas rounded-2xl p-8 text-center text-white;
        }

        .features-showcase__cta-content {
          @apply max-w-2xl mx-auto;
        }

        .features-showcase__cta-title {
          @apply text-2xl font-bold mb-4;
        }

        .features-showcase__cta-description {
          @apply text-saas-100 mb-6;
        }

        .features-showcase__cta-actions {
          @apply flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4;
        }
      `}</style>
    </section>
  );
}