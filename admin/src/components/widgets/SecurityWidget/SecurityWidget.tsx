import { createSignal, Show, Index } from 'solid-js'
import styles from './SecurityWidget.module.css'

export default function SecurityWidget() {
  const [showPasswordForm, setShowPasswordForm] = createSignal(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = createSignal(false)
  const [sessions] = createSignal([
    { device: 'Chrome on MacOS', location: 'San Francisco, CA', time: 'Active now', current: true },
    { device: 'Safari on iPhone', location: 'San Francisco, CA', time: '2 hours ago', current: false },
    { device: 'Firefox on Windows', location: 'New York, NY', time: 'Yesterday', current: false }
  ])

  return (
    <div class={styles.container}>
      <h3 class={styles.title}>Security</h3>
      
      <div class={styles.content}>
        {/* Password */}
        <div class={styles.passwordSection}>
          <div class={styles.passwordHeader}>
            <div class={styles.passwordInfo}>
              <h4 class={styles.passwordTitle}>Password</h4>
              <p class={styles.passwordLastChanged}>Last changed 3 months ago</p>
            </div>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm())}
              class={styles.passwordButton}
            >
              {showPasswordForm() ? 'Cancel' : 'Change'}
            </button>
          </div>
          
          <Show when={showPasswordForm()}>
            <div class={styles.passwordForm}>
              <input
                type="password"
                placeholder="Current password"
                class={styles.passwordInput}
              />
              <input
                type="password"
                placeholder="New password"
                class={styles.passwordInput}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                class={styles.passwordInput}
              />
              <button class={styles.passwordSubmitButton}>
                Update Password
              </button>
            </div>
          </Show>
        </div>

        {/* Two-factor authentication */}
        <div class={styles.twoFactorSection}>
          <div class={styles.twoFactorInfo}>
            <h4 class={styles.twoFactorTitle}>Two-factor authentication</h4>
            <p class={styles.twoFactorStatus}>{twoFactorEnabled() ? 'Enabled' : 'Not enabled'}</p>
          </div>
          <button
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled())}
            class={`${styles.toggleSwitch} ${
              twoFactorEnabled() ? styles.toggleSwitchEnabled : styles.toggleSwitchDisabled
            }`}
          >
            <span
              class={`${styles.toggleHandle} ${
                twoFactorEnabled() ? styles.toggleHandleEnabled : styles.toggleHandleDisabled
              }`}
            />
          </button>
        </div>

        {/* Active sessions */}
        <div class={styles.sessionsSection}>
          <h4 class={styles.sessionsTitle}>Active sessions</h4>
          <div class={styles.sessionsList}>
            <Index each={sessions()}>
              {(session) => (
                <div class={styles.sessionItem}>
                  <div class={styles.sessionInfo}>
                    <p class={styles.sessionDevice}>{session().device}</p>
                    <p class={styles.sessionDetails}>{session().location} · {session().time}</p>
                  </div>
                  <Show when={!session().current}>
                    <button class={styles.revokeButton}>
                      Revoke
                    </button>
                  </Show>
                </div>
              )}
            </Index>
          </div>
        </div>

        <button class={styles.signOutButton}>
          Sign out all devices
        </button>
      </div>
    </div>
  )
}