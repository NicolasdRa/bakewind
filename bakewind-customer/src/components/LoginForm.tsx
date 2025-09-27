import { type Component } from "solid-js";
import { A } from "@solidjs/router";
import Logo from "./Logo/Logo";
import ThemeToggle from "./ThemeToggle/ThemeToggle";
import { useAppStore } from "~/stores/appStore";
import styles from "./LoginForm.module.css";

type Props = {
  onSubmit: (e: Event) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
};

export const LoginForm: Component<Props> = (props) => {
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
          <h2 class={styles.title}>Welcome back</h2>
          <p class={styles.subtitle}>Sign in to access your bakery dashboard</p>
        </div>
        <div class={styles.form}>
          <label class={styles.label}>
            Email
            <input
              type="email"
              name="email"
              required
              autocomplete="email"
              placeholder="Enter your email"
              class={styles.input}
            />
          </label>
          <label class={styles.label}>
            Password
            <input
              type="password"
              name="password"
              required
              autocomplete="current-password"
              placeholder="Enter your password"
              class={styles.input}
            />
          </label>
          <button
            type="submit"
            class={styles.submitButton}
          >
            Sign In
          </button>

          <div class={styles.signupPrompt}>
            <p class={styles.signupText}>
              New to BakeWind?
              <A href="/trial-signup" class={styles.signupLink}>
                Start your free 14-day trial
              </A>
            </p>
          </div>
        </div>
      </main>
      <footer class={styles.footer}>
        <a
          class={styles.footerLink}
          href="#"
        >
          About Us
        </a>
        <a
          class={styles.footerLink}
          href="#"
        >
          Privacy Policy & Terms →
        </a>
      </footer>
    </div>
  );
};