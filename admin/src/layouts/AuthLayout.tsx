import { Component, JSX } from 'solid-js';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: JSX.Element;
}

const AuthLayout: Component<AuthLayoutProps> = (props) => {
  return (
    <div class={styles.container}>
      {/* Header */}
      <header class={styles.header}>
        <a href="/login" class={styles.logoLink}>
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none" style="color: var(--primary-color)">
            <path d="M50 10 L90 90 L10 90 Z" fill="currentColor" />
          </svg>
        </a>
      </header>

      <main class={styles.main}>
        <div class={styles.headerText}>
          <h2 class={styles.title}>{props.title}</h2>
          {props.subtitle && <p class={styles.subtitle}>{props.subtitle}</p>}
        </div>

        <div class={styles.content}>
          {props.children}
        </div>
      </main>

      <footer class={styles.footer}>
        <a href="#" class={styles.footerLink}>
          About Us
        </a>
        <a href="#" class={styles.footerLink}>
          Privacy Policy & Terms
        </a>
      </footer>
    </div>
  );
};

export default AuthLayout;
