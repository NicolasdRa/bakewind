import { type Component } from "solid-js";
import { A } from "@solidjs/router";
import Logo from "./Logo/Logo";
import ThemeToggle from "./ThemeToggle/ThemeToggle";
import { useAppStore } from "~/stores/appStore";
import styles from "./LoginForm.module.css"; // Reuse LoginForm styles

export const TrialSignupForm: Component = () => {
  const { state, actions } = useAppStore();

  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    actions.setTheme(newTheme);
  };

  return (
    <div class={styles.container}>
      {/* Header with Logo, Home Link, and Theme Toggle */}
      <header class={styles.header}>
        <A href="/" class={styles.logoLink}>
          <Logo size="small" />
        </A>
        <div class={styles.headerControls}>
          <ThemeToggle
            theme={state.theme}
            onToggle={toggleTheme}
            className={styles.themeToggle}
          />
          <A href="/" class={styles.backLink}>
            ← Back to Home
          </A>
        </div>
      </header>

      <main class={styles.main}>
        <div class={styles.headerText}>
          <h2 class={styles.title}>Start Your Free Trial</h2>
          <p class={styles.subtitle}>Get 14 days of full access to BakeWind. No credit card required.</p>
        </div>
        <div class={styles.form}>
          <label class={styles.label}>
            Business Name
            <input
              type="text"
              name="businessName"
              required
              autocomplete="organization"
              placeholder="Your Bakery Name"
              class={styles.input}
            />
          </label>
          <label class={styles.label}>
            Your Name
            <input
              type="text"
              name="fullName"
              required
              autocomplete="name"
              placeholder="John Smith"
              class={styles.input}
            />
          </label>
          <label class={styles.label}>
            Email Address
            <input
              type="email"
              name="email"
              required
              autocomplete="email"
              placeholder="john@yourbakery.com"
              class={styles.input}
            />
          </label>
          <label class={styles.label}>
            Phone Number
            <input
              type="tel"
              name="phone"
              required
              autocomplete="tel"
              placeholder="+1 (555) 123-4567"
              class={styles.input}
            />
          </label>
          <label class={styles.label}>
            Password
            <input
              type="password"
              name="password"
              required
              autocomplete="new-password"
              placeholder="Create a secure password"
              class={styles.input}
            />
          </label>
          <label class={styles.label}>
            Number of Locations
            <select
              name="locations"
              required
              class={styles.input}
            >
              <option value="">Select number of locations</option>
              <option value="1">1 location</option>
              <option value="2-3">2-3 locations</option>
              <option value="4-10">4-10 locations</option>
              <option value="10+">10+ locations</option>
            </select>
          </label>

          <div style={{
            "font-size": "0.875rem",
            color: "var(--text-secondary)",
            "line-height": "1.5",
            "margin-top": "1rem"
          }}>
            <label style={{
              display: "flex",
              "align-items": "flex-start",
              gap: "0.5rem",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                name="agreeToTerms"
                required
                style={{
                  "margin-top": "0.125rem",
                  "flex-shrink": "0"
                }}
              />
              <span>
                I agree to the{" "}
                <a href="#terms" style={{ color: "var(--primary-color)", "text-decoration": "underline" }}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#privacy" style={{ color: "var(--primary-color)", "text-decoration": "underline" }}>
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          <button
            type="submit"
            class={styles.submitButton}
          >
            Start Free Trial
          </button>

          <div class={styles.signupPrompt}>
            <p class={styles.signupText}>
              Already have an account?
              <A href="/login" class={styles.signupLink}>
                Sign in here
              </A>
            </p>
          </div>
        </div>
      </main>
      <footer class={styles.footer}>
        <a
          class={styles.footerLink}
          href="/"
        >
          About BakeWind
        </a>
        <a
          class={styles.footerLink}
          href="/pricing"
        >
          View Pricing Plans →
        </a>
      </footer>
    </div>
  );
};