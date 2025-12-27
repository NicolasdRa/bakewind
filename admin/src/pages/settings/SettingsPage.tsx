import { Component} from "solid-js";
import { Heading, Text } from "~/components/common/Typography";
import styles from './SettingsPage.module.css'


const SettingsPage: Component = () => {


  return (
       <div class={styles.container}>
        <div class={styles.header}>
          <div class={styles.headerContent}>
            <Heading level="h1" variant="page">Settings</Heading>
            <Text color="secondary">Configure your dashboard settings and manage system preferences</Text>
          </div>
        </div>

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
      </div>
  );
};

export default SettingsPage;