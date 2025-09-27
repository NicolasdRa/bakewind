import { createMemo, createSignal, Show } from 'solid-js'
import { useAppStore } from '~/stores/appStore'
import { usePreferences } from '~/hooks/usePreferences'
import styles from './PreferencesWidget.module.css'

export default function PreferencesWidget() {
  const { state } = useAppStore()
  const { updatePreferences, getPreferences, isUpdating, updateError, clearError } = usePreferences()
  const [isSubmitting, setIsSubmitting] = createSignal(false)

  // Get preferences from localStorage and app state
  const preferences = createMemo(() => {
    const stored = getPreferences()
    return {
      theme: state.theme,
      displayDensity: stored.displayDensity || 'comfortable',
      dashboardLayout: state.dashboardLayout,
      sidebarCollapsed: state.sidebarCollapsed,
      enableAnimations: stored.enableAnimations ?? true,
      enableSounds: stored.enableSounds ?? false,
      autoSave: stored.autoSave ?? true
    }
  })

  const handleSubmit = async (event: Event) => {
    event.preventDefault()
    clearError()
    setIsSubmitting(true)

    const form = event.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      await updatePreferences({
        theme: formData.get('theme') as string,
        displayDensity: formData.get('displayDensity') as string,
        dashboardLayout: formData.get('dashboardLayout') as string,
        sidebarCollapsed: formData.get('sidebarCollapsed') === 'on',
        enableAnimations: formData.get('enableAnimations') === 'on',
        enableSounds: formData.get('enableSounds') === 'on',
        autoSave: formData.get('autoSave') === 'on'
      })
    } catch (error) {
      console.error('Failed to update preferences:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div class={styles.container}>
      <h3 class={styles.title}>Preferences</h3>

      <Show when={updateError}>
        <div class={styles.errorMessage}>
          {updateError}
        </div>
      </Show>

      <form onSubmit={handleSubmit} class={styles.content}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel}>Theme</label>
          <select 
            name="theme"
            value={preferences().theme}
            class={styles.fieldSelect}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel}>Display density</label>
          <select 
            name="displayDensity"
            value={preferences().displayDensity}
            class={styles.fieldSelect}
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
            <option value="spacious">Spacious</option>
          </select>
        </div>

        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel}>Dashboard layout</label>
          <select 
            name="dashboardLayout"
            value={preferences().dashboardLayout}
            class={styles.fieldSelect}
          >
            <option value="grid">Grid</option>
            <option value="list">List</option>
            <option value="masonry">Masonry</option>
          </select>
        </div>

        <div class={styles.featuresSection}>
          <h4 class={styles.sectionTitle}>Features</h4>
          
          <label class={styles.toggleLabel}>
            <span class={styles.toggleText}>Collapse sidebar by default</span>
            <input 
              name="sidebarCollapsed"
              type="checkbox"
              value="true"
              checked={preferences().sidebarCollapsed}
              class={styles.toggleCheckbox}
            />
          </label>

          <label class={styles.toggleLabel}>
            <span class={styles.toggleText}>Enable animations</span>
            <input 
              name="enableAnimations"
              type="checkbox"
              value="true"
              checked={preferences().enableAnimations}
              class={styles.toggleCheckbox}
            />
          </label>

          <label class={styles.toggleLabel}>
            <span class={styles.toggleText}>Sound effects</span>
            <input 
              name="enableSounds"
              type="checkbox"
              value="true"
              checked={preferences().enableSounds}
              class={styles.toggleCheckbox}
            />
          </label>

          <label class={styles.toggleLabel}>
            <span class={styles.toggleText}>Auto-save changes</span>
            <input 
              name="autoSave"
              type="checkbox"
              value="true"
              checked={preferences().autoSave}
              class={styles.toggleCheckbox}
            />
          </label>
        </div>

        <button type="submit" class={styles.applyButton} disabled={isUpdating || isSubmitting()}>
          {(isUpdating || isSubmitting()) ? 'Saving...' : 'Apply Preferences'}
        </button>
      </form>
    </div>
  )
}