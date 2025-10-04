import { createSignal, Show, For } from 'solid-js'
import { A } from '@solidjs/router'
import { useAuthUser } from '~/hooks/useAuthUser'
import SEO from '~/components/SEO/SEO'
import Logo from '~/components/Logo/Logo'
import ThemeToggle from '~/components/ThemeToggle/ThemeToggle'
import { APP_URLS } from '~/lib/app-urls'
import styles from './pricing.module.css'

type Region = 'US' | 'UK' | 'DE'
type Currency = '$' | '£' | '€'

interface PricingTier {
  id: string
  name: string
  description: string
  popular?: boolean
  prices: { US: number; UK: number; DE: number }
  features: string[]
  limitations: string[]
  maxLocations: number | 'unlimited'
  cta: string
}

export default function PricingPage() {
  const user = useAuthUser()
  const [selectedRegion, setSelectedRegion] = createSignal<Region>('US')
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false)

  // Initialize theme
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('landingTheme') || 'light'
    setTheme(savedTheme as 'light' | 'dark')
    document.documentElement.setAttribute('data-theme', savedTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme() === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('landingTheme', newTheme)
  }

  const regionConfig = {
    US: { currency: '$' as Currency, label: 'United States' },
    UK: { currency: '£' as Currency, label: 'United Kingdom' },
    DE: { currency: '€' as Currency, label: 'Germany' }
  }

  const pricingTiers: PricingTier[] = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small, single-location bakeries just getting started',
      prices: { US: 49, UK: 39, DE: 45 },
      maxLocations: 1,
      features: [
        'Single location management',
        'Basic order tracking',
        'Simple inventory management',
        'Recipe storage (up to 50)',
        'Customer database',
        'Basic reporting',
        'Email support',
        'Mobile app access'
      ],
      limitations: [
        'Limited to 1 location',
        'Basic reporting only',
        'No advanced integrations'
      ],
      cta: 'Start Free Trial'
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Ideal for growing bakeries with multiple locations and advanced needs',
      popular: true,
      prices: { US: 149, UK: 119, DE: 139 },
      maxLocations: 3,
      features: [
        'Up to 3 locations',
        'Advanced order management',
        'Production planning & scheduling',
        'Smart inventory tracking with alerts',
        'Unlimited recipes & categories',
        'Customer loyalty programs',
        'Advanced analytics & insights',
        'Staff management & permissions',
        'POS system integration',
        'Priority email & chat support',
        'Custom branding'
      ],
      limitations: [
        'Limited to 3 locations',
        'Standard integrations only'
      ],
      cta: 'Start Free Trial'
    },
    {
      id: 'business',
      name: 'Business',
      description: 'Comprehensive solution for established bakery chains and franchises',
      prices: { US: 399, UK: 319, DE: 369 },
      maxLocations: 10,
      features: [
        'Up to 10 locations',
        'Multi-location inventory sync',
        'Centralized production planning',
        'Advanced staff scheduling',
        'Financial reporting & cost analysis',
        'Supplier management & procurement',
        'Quality control tracking',
        'Custom integrations (API access)',
        'Franchise management tools',
        'Advanced customer segmentation',
        'Automated reorder points',
        'Phone support & dedicated account manager'
      ],
      limitations: [
        'Limited to 10 locations'
      ],
      cta: 'Start Free Trial'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Tailored solution for large bakery operations with custom requirements',
      prices: { US: 0, UK: 0, DE: 0 }, // Custom pricing
      maxLocations: 'unlimited',
      features: [
        'Unlimited locations',
        'White-label solution',
        'Custom feature development',
        'Advanced security & compliance',
        'Dedicated infrastructure',
        'Custom integrations & APIs',
        'Advanced reporting & BI tools',
        'Multi-language support',
        'SSO & advanced user management',
        'Priority 24/7 phone support',
        'Dedicated customer success manager',
        'On-site training & setup'
      ],
      limitations: [],
      cta: 'Contact Sales'
    }
  ]

  const formatPrice = (price: number, region: Region) => {
    if (price === 0) return 'Custom'
    const currency = regionConfig[region].currency
    return `${currency}${price}`
  }

  return (
    <>
      <SEO
        title="Pricing - BakeWind"
        description="Choose the perfect plan for your bakery. From single locations to enterprise chains, we have a solution that fits your needs and budget."
        path="/pricing"
      />

      <div class={styles.container}>
        {/* Navigation */}
        <nav class={styles.navigation}>
          <div class={styles.navContent}>
            <A href="/" class={styles.logoLink}>
              <Logo size="medium" />
            </a>

            {/* Desktop Navigation */}
            <div class={styles.navActions}>
              <A href="/" class={styles.navLink}>Home</a>
              <A href="/pricing" class={styles.navLink} classList={{ [styles.navLinkActive]: true }}>Pricing</a>
              <ThemeToggle theme={theme()} onToggle={toggleTheme} />

              <Show
                when={user && user.id}
                fallback={
                  <a href={APP_URLS.login} class={styles.loginButton}>
                    Sign In
                  </a>
                }
              >
                <A href="/dashboard" class={styles.dashboardButton}>
                  Dashboard
                </a>
              </Show>
            </div>

            {/* Mobile Menu Button */}
            <button
              class={styles.mobileMenuButton}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen())}
              aria-label="Toggle mobile menu"
            >
              <Show when={!mobileMenuOpen()} fallback={
                <svg class={styles.menuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              }>
                <svg class={styles.menuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Show>
            </button>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        <Show when={mobileMenuOpen()}>
          <div class={styles.mobileMenuOverlay} onClick={() => setMobileMenuOpen(false)}>
            <div class={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
              <div class={styles.mobileMenuContent}>
                <A href="/" class={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                  Home
                </a>
                <A href="/pricing" class={styles.mobileNavLink} classList={{ [styles.mobileNavLinkActive]: true }} onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </a>

                <div class={styles.mobileThemeToggle}>
                  <ThemeToggle theme={theme()} onToggle={toggleTheme} />
                </div>

                <Show
                  when={user && user.id}
                  fallback={
                    <a href={APP_URLS.login} class={styles.mobileLoginButton} onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </a>
                  }
                >
                  <A href="/dashboard" class={styles.mobileDashboardButton} onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </a>
                </Show>
              </div>
            </div>
          </div>
        </Show>

        {/* Header Section */}
        <section class={styles.header}>
          <div class={styles.headerContent}>
            <h1 class={styles.title}>
              Choose Your Perfect Plan
            </h1>
            <p class={styles.subtitle}>
              Scale your bakery operations with confidence. Start with a 14-day free trial, no credit card required.
            </p>

            {/* Region Selector */}
            <div class={styles.regionSelector}>
              <span class={styles.regionLabel}>Pricing for:</span>
              <div class={styles.regionButtons}>
                <For each={Object.entries(regionConfig)}>
                  {([key, config]) => (
                    <button
                      class={styles.regionButton}
                      classList={{ [styles.regionButtonActive]: selectedRegion() === key }}
                      onClick={() => setSelectedRegion(key as Region)}
                    >
                      {config.label}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section class={styles.pricing}>
          <div class={styles.pricingContent}>
            <div class={styles.pricingGrid}>
              <For each={pricingTiers}>
                {(tier) => (
                  <div
                    class={styles.pricingCard}
                    classList={{
                      [styles.pricingCardPopular]: tier.popular,
                      [styles.pricingCardEnterprise]: tier.id === 'enterprise'
                    }}
                  >
                  {tier.popular && (
                    <div class={styles.popularBadge}>Most Popular</div>
                  )}

                  <div class={styles.cardHeader}>
                    <h3 class={styles.cardTitle}>{tier.name}</h3>
                    <p class={styles.cardDescription}>{tier.description}</p>

                    <div class={styles.cardPrice}>
                      <span class={styles.price}>
                        {formatPrice(tier.prices[selectedRegion()], selectedRegion())}
                      </span>
                      {tier.prices[selectedRegion()] > 0 && (
                        <span class={styles.priceUnit}>/month</span>
                      )}
                    </div>

                    <div class={styles.cardMeta}>
                      <span class={styles.locations}>
                        {tier.maxLocations === 'unlimited'
                          ? 'Unlimited locations'
                          : `Up to ${tier.maxLocations} location${tier.maxLocations > 1 ? 's' : ''}`
                        }
                      </span>
                    </div>
                  </div>

                  <div class={styles.cardBody}>
                    <ul class={styles.featuresList}>
                      <For each={tier.features}>
                        {(feature) => (
                          <li class={styles.feature}>
                            <svg class={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>

                  <div class={styles.cardFooter}>
                    <Show
                      when={tier.id === 'enterprise'}
                      fallback={
                        <a href={APP_URLS.login} class={styles.ctaButton}>
                          {tier.cta}
                        </a>
                      }
                    >
                      <button class={styles.ctaButtonSecondary}>
                        {tier.cta}
                      </button>
                    </Show>
                  </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section class={styles.faq}>
          <div class={styles.faqContent}>
            <h2 class={styles.faqTitle}>Frequently Asked Questions</h2>

            <div class={styles.faqGrid}>
              <div class={styles.faqItem}>
                <h3 class={styles.faqQuestion}>Can I change plans at any time?</h3>
                <p class={styles.faqAnswer}>
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                  and we'll pro-rate the billing accordingly.
                </p>
              </div>

              <div class={styles.faqItem}>
                <h3 class={styles.faqQuestion}>Is there a setup fee?</h3>
                <p class={styles.faqAnswer}>
                  No setup fees for Starter, Professional, and Business plans. Enterprise plans may include
                  setup and training services as part of the custom package.
                </p>
              </div>

              <div class={styles.faqItem}>
                <h3 class={styles.faqQuestion}>What happens after the free trial?</h3>
                <p class={styles.faqAnswer}>
                  After your 14-day free trial, you'll need to choose a paid plan to continue using BakeWind.
                  Your data will be safely stored for 30 days if you need more time to decide.
                </p>
              </div>

              <div class={styles.faqItem}>
                <h3 class={styles.faqQuestion}>Do you offer discounts for annual billing?</h3>
                <p class={styles.faqAnswer}>
                  Yes! Save 20% when you choose annual billing for any paid plan.
                  Contact us for volume discounts on Enterprise plans.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section class={styles.cta}>
          <div class={styles.ctaContent}>
            <h2 class={styles.ctaTitle}>Ready to grow your bakery?</h2>
            <p class={styles.ctaDescription}>
              Join hundreds of bakeries already using BakeWind to streamline their operations
            </p>
            <a href={APP_URLS.login} class={styles.ctaButtonLarge}>
              Start Free Trial
            </a>
          </div>
        </section>
      </div>
    </>
  )
}