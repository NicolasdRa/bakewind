import { A } from "@solidjs/router";
import SEO from '~/components/SEO/SEO';
import DashboardLayout from '~/layouts/DashboardLayout/DashboardLayout';
import styles from './[...404].module.css';

export default function NotFound() {
  return (
    <>
      <SEO 
        title="Page Not Found"
        description="The page you are looking for could not be found. Return to the dashboard or explore other sections of the application."
        path="/404"
      />
      
      <DashboardLayout 
        title="Page Not Found"
        subtitle="The page you're looking for doesn't exist"
      >
        <main class={styles.container}>
          <h1 class={styles.title}>404 - Not Found</h1>
          <p class={styles.content}>
            <span class={styles.contentText}>The page you're looking for doesn't exist. Return to the{" "}</span>
            <A href="/" class={styles.link}>
              dashboard
            </A>
            <span class={styles.contentText}>{" "}or explore other sections.</span>
          </p>
          <p class={styles.navigation}>
            <A href="/" class={styles.link}>
              Dashboard
            </A>
            <span class={styles.navSeparator}>{" - "}</span>
            <A href="/analytics" class={styles.link}>
              Analytics
            </A>
            <span class={styles.navSeparator}>{" - "}</span>
            <A href="/settings" class={styles.link}>
              Settings
            </A>
          </p>
        </main>
      </DashboardLayout>
    </>
  );
}
