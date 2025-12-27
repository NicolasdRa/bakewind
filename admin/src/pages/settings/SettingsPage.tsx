import { Component} from "solid-js";
import DashboardPageLayout from "~/layouts/DashboardPageLayout";
import { Heading } from "~/components/common/Typography";
import styles from './SettingsPage.module.css'


const SettingsPage: Component = () => {


  return (
    <DashboardPageLayout
      title="Settings"
      subtitle="Configure your dashboard settings and manage system preferences"
    >
        <div class={styles.settingsGrid}>
          <div class={styles.settingsCard}>
            <Heading variant="card" class={styles.cardTitle}>General Settings</Heading>
            <div class={styles.formGroup}>
              <div>
                <label class={styles.label}>Application Name</label>
                <input
                  type="text"
                  value="My Dashboard"
                  class={styles.input}
                />
              </div>
              <div>
                <label class={styles.label}>Default Language</label>
                <select class={styles.select}>
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>
          </div>

          <div class={styles.settingsCard}>
            <Heading variant="card" class={styles.cardTitle}>Advanced Settings</Heading>
            <div class={styles.checkboxGroup}>
              <label class={styles.checkboxLabel}>
                <span class={styles.checkboxText}>Enable developer mode</span>
                <input type="checkbox" class={styles.checkbox} />
              </label>
              <label class={styles.checkboxLabel}>
                <span class={styles.checkboxText}>Show performance metrics</span>
                <input type="checkbox" class={styles.checkbox} />
              </label>
              <label class={styles.checkboxLabel}>
                <span class={styles.checkboxText}>Enable experimental features</span>
                <input type="checkbox" class={styles.checkbox} />
              </label>
            </div>
          </div>
        </div>
    </DashboardPageLayout>
  );
};

export default SettingsPage;