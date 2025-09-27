import { createSignal, createMemo, Show } from 'solid-js'
import { useAccountMutations } from '~/hooks/useAccountMutations'
import styles from './AccountSettingsWidget.module.css'

export default function AccountSettingsWidget() {
  const { updateAccountSettings, isUpdating, updateError, clearError } = useAccountMutations()
  const [isSubmitting, setIsSubmitting] = createSignal(false)

  // Get settings from localStorage with defaults
  const settings = createMemo(() => {
    if (typeof window === 'undefined') {
      return {
        language: 'en',
        timezone: 'America/Los_Angeles',
        emailNotifications: true,
        pushNotifications: false,
        marketingEmails: false
      }
    }
    const stored = JSON.parse(localStorage.getItem('accountSettings') || '{}')
    return {
      language: stored.language || 'en',
      timezone: stored.timezone || 'America/Los_Angeles',
      emailNotifications: stored.emailNotifications ?? true,
      pushNotifications: stored.pushNotifications ?? false,
      marketingEmails: stored.marketingEmails ?? false
    }
  })

  const handleSubmit = async (event: Event) => {
    event.preventDefault()
    clearError()
    setIsSubmitting(true)

    const form = event.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      await updateAccountSettings({
        language: formData.get('language') as string,
        timezone: formData.get('timezone') as string,
        emailNotifications: formData.get('emailNotifications') === 'on',
        pushNotifications: formData.get('pushNotifications') === 'on',
        marketingEmails: formData.get('marketingEmails') === 'on'
      })
    } catch (error) {
      console.error('Failed to update account settings:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div class={styles.container}>
      <h3 class={styles.title}>Account Settings</h3>

      <Show when={updateError}>
        <div class={styles.errorMessage}>
          {updateError}
        </div>
      </Show>

      <form onSubmit={handleSubmit} class={styles.content}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel}>Language</label>
          <select 
            name="language"
            value={settings().language}
            class={styles.fieldSelect}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel}>Timezone</label>
          <select 
            name="timezone"
            value={settings().timezone}
            class={styles.fieldSelect}
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </select>
        </div>

        <div class={styles.notificationsSection}>
          <h4 class={styles.sectionTitle}>Notifications</h4>
          
          <label class={styles.toggleLabel}>
            <span class={styles.toggleText}>Email notifications</span>
            <input 
              name="emailNotifications"
              type="checkbox"
              value="true"
              checked={settings().emailNotifications}
              class={styles.toggleCheckbox}
            />
          </label>

          <label class={styles.toggleLabel}>
            <span class={styles.toggleText}>Push notifications</span>
            <input 
              name="pushNotifications"
              type="checkbox"
              value="true"
              checked={settings().pushNotifications}
              class={styles.toggleCheckbox}
            />
          </label>

          <label class={styles.toggleLabel}>
            <span class={styles.toggleText}>Marketing emails</span>
            <input 
              name="marketingEmails"
              type="checkbox"
              value="true"
              checked={settings().marketingEmails}
              class={styles.toggleCheckbox}
            />
          </label>
        </div>

        <button type="submit" class={styles.saveButton} disabled={isUpdating || isSubmitting()}>
          {(isUpdating || isSubmitting()) ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}