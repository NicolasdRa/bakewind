import { Component, JSX, Show, onMount } from 'solid-js';
import { appState, appActions } from '~/stores/appStore';
import { SunIcon, MoonIcon, WindIcon } from '~/components/icons';
import { Heading, Text } from '~/components/common/Typography';
import Button from '~/components/common/Button';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: JSX.Element;
}

const AuthLayout: Component<AuthLayoutProps> = (props) => {
  // Initialize theme from localStorage on mount
  onMount(() => {
    appActions.initializeClientState();
  });

  const isDark = () => appState.theme === 'dark';

  const toggleTheme = () => {
    appActions.setTheme(appState.theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div class={styles.container}>
      {/* Header */}
      <header class={styles.header}>
        <a href="/login" class={styles.logoLink}>
          <WindIcon class={styles.logoIcon} />
          <Text as="span" class={styles.logoText}>BakeWind</Text>
        </a>
      </header>

      <main class={styles.main}>
        <div class={styles.headerText}>
          <Heading variant="section" class={styles.title}>{props.title}</Heading>
          {props.subtitle && <Text color="secondary" class={styles.subtitle}>{props.subtitle}</Text>}
        </div>

        <div class={styles.content}>
          {props.children}
        </div>

        {/* Theme Toggle */}
        <Button
          variant="subtle"
          onClick={toggleTheme}
          aria-label={isDark() ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark() ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Show
            when={isDark()}
            fallback={<MoonIcon class={styles.themeIcon} />}
          >
            <SunIcon class={styles.themeIcon} />
          </Show>
          <Text as="span" variant="helper" color="tertiary">{isDark() ? 'Light Mode' : 'Dark Mode'}</Text>
        </Button>
      </main>

      <footer class={styles.footer}>
        <a href="#" class={styles.footerLink}>
          <Text as="span" variant="body-sm">About Us</Text>
        </a>
        <a href="#" class={styles.footerLink}>
          <Text as="span" variant="body-sm">Privacy Policy & Terms</Text>
        </a>
      </footer>
    </div>
  );
};

export default AuthLayout;
