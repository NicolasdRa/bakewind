import { Show, Accessor } from 'solid-js'
import { LockIcon, KeyIcon } from '../icons'
import type { ChangePasswordData } from '~/queries/useChangePassword'
import styles from '../ProfileContent.module.css'

interface PasswordForm extends ChangePasswordData {
  showForm: boolean
}

interface SecuritySectionProps {
  passwordForm: Accessor<PasswordForm>
  passwordsMatch: () => boolean
  isPasswordFormValid: () => boolean
  isChangingPassword: boolean
  passwordError: any
  onTogglePasswordForm: () => void
  onChangePassword: () => void
  onUpdatePasswordField: (field: keyof ChangePasswordData, value: string) => void
}

export default function SecuritySection(props: SecuritySectionProps) {
  return (
    <div class={styles.section}>
      <h2 class={styles.sectionTitle}>
        <div class={styles.sectionIcon}>
          <LockIcon />
        </div>
        Account Security
      </h2>

      <div class={styles.securityCard}>
        <Show when={!props.passwordForm().showForm}>
          <button
            onClick={props.onTogglePasswordForm}
            class={styles.changePasswordButton}
          >
            <div class={styles.buttonIcon}>
              <KeyIcon />
            </div>
            Change Password
          </button>
        </Show>

        <Show when={props.passwordForm().showForm}>
          <div class={styles.passwordForm}>
            <h3 class={styles.passwordFormTitle}>Change Your Password</h3>

            <div class={styles.passwordField}>
              <label class={styles.label}>Current Password</label>
              <input
                type="password"
                value={props.passwordForm().currentPassword}
                onInput={(e) => props.onUpdatePasswordField('currentPassword', e.currentTarget.value)}
                class={styles.input}
                placeholder="Enter your current password"
              />
            </div>

            <div class={styles.passwordField}>
              <label class={styles.label}>New Password (min 6 characters)</label>
              <input
                type="password"
                value={props.passwordForm().newPassword}
                onInput={(e) => props.onUpdatePasswordField('newPassword', e.currentTarget.value)}
                class={styles.input}
                placeholder="Enter a new password"
              />
            </div>

            <div class={styles.passwordField}>
              <label class={styles.label}>Confirm New Password</label>
              <input
                type="password"
                value={props.passwordForm().confirmPassword}
                onInput={(e) => props.onUpdatePasswordField('confirmPassword', e.currentTarget.value)}
                class={`${styles.input} ${props.passwordForm().confirmPassword && !props.passwordsMatch() ? styles.inputError : ''}`}
                placeholder="Confirm your new password"
              />
              <Show when={props.passwordForm().confirmPassword && !props.passwordsMatch()}>
                <p class={styles.validationError}>Passwords do not match</p>
              </Show>
            </div>

            <div class={styles.passwordFormActions}>
              <button
                onClick={props.onTogglePasswordForm}
                class={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={props.onChangePassword}
                disabled={!props.isPasswordFormValid() || props.isChangingPassword}
                class={styles.dangerButton}
              >
                {props.isChangingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>

            <Show when={props.passwordError}>
              <p class={styles.validationError}>{props.passwordError?.message}</p>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  )
}