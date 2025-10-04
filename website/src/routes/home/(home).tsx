import { A } from '@solidjs/router'
import { createSignal, createEffect, onMount } from 'solid-js'
import SEO from '~/components/SEO/SEO'
import Logo from '~/components/Logo/Logo'
import ThemeToggle from '~/components/ThemeToggle/ThemeToggle'
import FeatureIcon from '~/components/FeatureIcon/FeatureIcon'
import DashboardPreview from '~/components/DashboardPreview/DashboardPreview'
import { APP_URLS } from '~/lib/app-urls'
import styles from './home.module.css'

export default function LandingPage() {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false)

  // Initialize theme from localStorage or system preference
  onMount(() => {
    const savedTheme = localStorage.getItem('landingTheme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light')
    setTheme(initialTheme as 'light' | 'dark')

    // Set both data-theme and class for compatibility
    document.documentElement.setAttribute('data-theme', initialTheme)
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  // Update theme when it changes
  createEffect(() => {
    const currentTheme = theme()
    document.documentElement.setAttribute('data-theme', currentTheme)
    localStorage.setItem('landingTheme', currentTheme)

    // Update class for Tailwind dark mode
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <>
      <SEO
        title="BakeWind - Modern Bakery Management"
        description="Streamline your bakery operations with our comprehensive management system. Track orders, manage inventory, and boost productivity."
        path="/"
      />

      <div class={styles.container}>
        {/* Navigation */}
        <nav class={styles.navigation}>
          <div class={styles.navContent}>
            <A href="/" class={styles.logoLink}>
              <Logo size="medium" />
            </A>

            {/* Desktop Navigation */}
            <div class={styles.navActions}>
              <A href="/" class={styles.navLink} classList={{ [styles.navLinkActive]: true }}>Home</A>
              <A href="/pricing" class={styles.navLink}>Pricing</A>
              <ThemeToggle theme={theme()} onToggle={toggleTheme} />

              <a href={APP_URLS.login} class={styles.loginButton}>
                Sign In
              </a>
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
                <A href="/" class={styles.mobileNavLink} classList={{ [styles.mobileNavLinkActive]: true }} onClick={() => setMobileMenuOpen(false)}>
                  Home
                </A>
                <A href="/pricing" class={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </A>

                <div class={styles.mobileThemeToggle}>
                  <ThemeToggle theme={theme()} onToggle={toggleTheme} />
                </div>

                <a href={APP_URLS.login} class={styles.mobileLoginButton} onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </a>
              </div>
            </div>
          </div>
        </Show>

        {/* Hero Section */}
        <section class={styles.hero}>
          <div class={styles.heroContent}>
            <div class={styles.heroText}>
              <h1 class={styles.heroTitle}>
                Modern Bakery Management
                <span class={styles.heroAccent}>Made Simple</span>
              </h1>
              <p class={styles.heroDescription}>
                Streamline your bakery operations with our comprehensive management system.
                Track orders, manage inventory, monitor production, and boost productivity—all in one place.
              </p>

              <div class={styles.heroActions}>
                <a href={APP_URLS.trialSignup} class={styles.ctaPrimary}>
                  Start Free Trial
                </a>
                <A href="/pricing" class={styles.ctaSecondary}>
                  View Pricing
                </A>
              </div>
            </div>

            <div class={styles.heroVisual}>
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section class={styles.features}>
          <div class={styles.featuresContent}>
            <h2 class={styles.featuresTitle}>Everything you need to run your bakery</h2>
            <p class={styles.featuresDescription}>
              Comprehensive tools designed specifically for bakery operations
            </p>

            <div class={styles.featuresGrid}>
              <div class={styles.featureCard}>
                <FeatureIcon type="orders" />
                <h3 class={styles.featureTitle}>Order Management</h3>
                <p class={styles.featureDescription}>
                  Track customer orders, internal orders, and delivery schedules in real-time.
                </p>
              </div>

              <div class={styles.featureCard}>
                <FeatureIcon type="inventory" />
                <h3 class={styles.featureTitle}>Inventory Control</h3>
                <p class={styles.featureDescription}>
                  Monitor ingredients, supplies, and finished products with automatic alerts.
                </p>
              </div>

              <div class={styles.featureCard}>
                <FeatureIcon type="production" />
                <h3 class={styles.featureTitle}>Production Planning</h3>
                <p class={styles.featureDescription}>
                  Schedule baking sessions, manage recipes, and optimize production workflows.
                </p>
              </div>

              <div class={styles.featureCard}>
                <FeatureIcon type="analytics" />
                <h3 class={styles.featureTitle}>Analytics & Reports</h3>
                <p class={styles.featureDescription}>
                  Get insights into sales trends, popular products, and operational efficiency.
                </p>
              </div>

              <div class={styles.featureCard}>
                <FeatureIcon type="customers" />
                <h3 class={styles.featureTitle}>Customer Management</h3>
                <p class={styles.featureDescription}>
                  Build relationships with detailed customer profiles and order history.
                </p>
              </div>

              <div class={styles.featureCard}>
                <FeatureIcon type="products" />
                <h3 class={styles.featureTitle}>Product Catalog</h3>
                <p class={styles.featureDescription}>
                  Manage your bakery's offerings with pricing, descriptions, and images.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer class={styles.footer}>
          <div class={styles.footerContent}>
            <div class={styles.footerBrand}>
              <Logo size="small" showSubtitle={false} theme="dark" />
              <p class={styles.footerDescription}>
                Modern bakery management made simple
              </p>
            </div>

            <div class={styles.footerLinks}>
              <div class={styles.footerSection}>
                <h4 class={styles.footerSectionTitle}>Product</h4>
                <ul class={styles.footerList}>
                  <li><a href="#features" class={styles.footerLink}>Features</a></li>
                  <li><A href="/pricing" class={styles.footerLink}>Pricing</A></li>
                  <li><a href="#support" class={styles.footerLink}>Support</a></li>
                </ul>
              </div>

              <div class={styles.footerSection}>
                <h4 class={styles.footerSectionTitle}>Company</h4>
                <ul class={styles.footerList}>
                  <li><a href="#about" class={styles.footerLink}>About</a></li>
                  <li><a href="#contact" class={styles.footerLink}>Contact</a></li>
                  <li><a href="#privacy" class={styles.footerLink}>Privacy</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div class={styles.footerBottom}>
            <p class={styles.footerCopyright}>
              © 2024 BakeWind. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}