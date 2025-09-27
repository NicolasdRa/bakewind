import { Show, createSignal, createMemo, createEffect, For } from 'solid-js'
import { useAuthUser } from '~/hooks/useAuthUser'
import { useUpdateProfile, type UpdateProfileData } from '~/queries/useUpdateProfile'
import { useChangePassword, type ChangePasswordData } from '~/queries/useChangePassword'
import LoadingSpinner from '~/components/LoadingSpinner'
import styles from './ProfileContent.module.css'

interface FormState extends UpdateProfileData {
  isDirty: boolean
}

interface PasswordForm extends ChangePasswordData {
  showForm: boolean
}

export default function ProfileContent() {
  const user = useAuthUser()
  const { updateProfile, isLoading: isUpdating, error: updateError } = useUpdateProfile()
  const { changePassword, isLoading: isChangingPassword, error: passwordError } = useChangePassword()

  // Initialize form state with user data
  const [form, setForm] = createSignal<FormState>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    bio: '',
    isDirty: false
  })

  // Password form state
  const [passwordForm, setPasswordForm] = createSignal<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showForm: false
  })

  // Success states
  const [updateSuccess, setUpdateSuccess] = createSignal(false)
  const [passwordSuccess, setPasswordSuccess] = createSignal(false)

  // Update form when user data loads
  createEffect(() => {
    const userData = user()
    if (userData) {
      setForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        bio: userData.bio || '',
        isDirty: false
      })
    }
  })

  // Check if form has changes
  const hasChanges = createMemo(() => {
    const userData = user()
    const formData = form()
    if (!userData) return false

    return (
      formData.firstName !== (userData.firstName || '') ||
      formData.lastName !== (userData.lastName || '') ||
      formData.phoneNumber !== (userData.phoneNumber || '') ||
      formData.bio !== (userData.bio || '')
    )
  })

  const updateFormField = (field: keyof UpdateProfileData, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
      isDirty: true
    }))
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!hasChanges()) return

    try {
      const formData = form()
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio
      })

      setUpdateSuccess(true)
      setForm(prev => ({ ...prev, isDirty: false }))

      // Hide success message after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handlePasswordSubmit = async (e: Event) => {
    e.preventDefault()
    const passwordData = passwordForm()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      // Handle password mismatch error
      return
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      })

      setPasswordSuccess(true)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showForm: false
      })

      // Hide success message after 3 seconds
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to change password:', error)
    }
  }

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <h1 class={styles.title}>Profile Settings</h1>
        <p class={styles.subtitle}>
          Manage your personal information and account settings
        </p>
      </div>

      <Show when={!user()} fallback={
        <div class={styles.content}>
          {/* Profile Information Section */}
          <div class={styles.section}>
            <div class={styles.sectionHeader}>
              <h2 class={styles.sectionTitle}>Personal Information</h2>
              <p class={styles.sectionDescription}>
                Update your personal details and contact information
              </p>
            </div>

            <form class={styles.form} onSubmit={handleSubmit}>
              <div class={styles.row}>
                <div class={styles.field}>
                  <label class={styles.label}>
                    First Name
                    <input
                      type="text"
                      value={form().firstName}
                      onInput={(e) => updateFormField('firstName', e.currentTarget.value)}
                      class={styles.input}
                      placeholder="Enter your first name"
                    />
                  </label>
                </div>

                <div class={styles.field}>
                  <label class={styles.label}>
                    Last Name
                    <input
                      type="text"
                      value={form().lastName}
                      onInput={(e) => updateFormField('lastName', e.currentTarget.value)}
                      class={styles.input}
                      placeholder="Enter your last name"
                    />
                  </label>
                </div>
              </div>

              <div class={styles.field}>
                <label class={styles.label}>
                  Email Address
                  <input
                    type="email"
                    value={user()?.email || ''}
                    readonly
                    class={`${styles.input} ${styles.readonly}`}
                  />
                </label>
                <p class={styles.helpText}>
                  Email address cannot be changed. Contact support if needed.
                </p>
              </div>

              <div class={styles.field}>
                <label class={styles.label}>
                  Phone Number
                  <input
                    type="tel"
                    value={form().phoneNumber}
                    onInput={(e) => updateFormField('phoneNumber', e.currentTarget.value)}
                    class={styles.input}
                    placeholder="Enter your phone number"
                  />
                </label>
              </div>

              <div class={styles.field}>
                <label class={styles.label}>
                  Bio
                  <textarea
                    value={form().bio}
                    onInput={(e) => updateFormField('bio', e.currentTarget.value)}
                    class={styles.textarea}
                    placeholder="Tell us about yourself"
                    rows="4"
                  />
                </label>
              </div>

              <Show when={updateError()}>
                <div class={styles.error}>
                  <p>{updateError()}</p>
                </div>
              </Show>

              <Show when={updateSuccess()}>
                <div class={styles.success}>
                  <p>Profile updated successfully!</p>
                </div>
              </Show>

              <div class={styles.actions}>
                <button
                  type="submit"
                  disabled={!hasChanges() || isUpdating()}
                  class={styles.button}
                  classList={{
                    [styles.buttonDisabled]: !hasChanges() || isUpdating()
                  }}
                >
                  <Show when={isUpdating()} fallback="Save Changes">
                    <LoadingSpinner size="small" />
                    Saving...
                  </Show>
                </button>
              </div>
            </form>
          </div>

          {/* Password Section */}
          <div class={styles.section}>
            <div class={styles.sectionHeader}>
              <h2 class={styles.sectionTitle}>Password & Security</h2>
              <p class={styles.sectionDescription}>
                Update your password to keep your account secure
              </p>
            </div>

            <Show when={!passwordForm().showForm} fallback={
              <form class={styles.form} onSubmit={handlePasswordSubmit}>
                <div class={styles.field}>
                  <label class={styles.label}>
                    Current Password
                    <input
                      type="password"
                      value={passwordForm().currentPassword}
                      onInput={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.currentTarget.value }))}
                      class={styles.input}
                      placeholder="Enter your current password"
                      required
                    />
                  </label>
                </div>

                <div class={styles.field}>
                  <label class={styles.label}>
                    New Password
                    <input
                      type="password"
                      value={passwordForm().newPassword}
                      onInput={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.currentTarget.value }))}
                      class={styles.input}
                      placeholder="Enter your new password"
                      required
                    />
                  </label>
                </div>

                <div class={styles.field}>
                  <label class={styles.label}>
                    Confirm New Password
                    <input
                      type="password"
                      value={passwordForm().confirmPassword}
                      onInput={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.currentTarget.value }))}
                      class={styles.input}
                      placeholder="Confirm your new password"
                      required
                    />
                  </label>
                </div>

                <Show when={passwordError()}>
                  <div class={styles.error}>
                    <p>{passwordError()}</p>
                  </div>
                </Show>

                <Show when={passwordSuccess()}>
                  <div class={styles.success}>
                    <p>Password changed successfully!</p>
                  </div>
                </Show>

                <div class={styles.actions}>
                  <button
                    type="button"
                    onClick={() => setPasswordForm(prev => ({ ...prev, showForm: false }))}
                    class={`${styles.button} ${styles.buttonSecondary}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword()}
                    class={styles.button}
                  >
                    <Show when={isChangingPassword()} fallback="Change Password">
                      <LoadingSpinner size="small" />
                      Changing...
                    </Show>
                  </button>
                </div>
              </form>
            }>
              <div class={styles.actions}>
                <button
                  type="button"
                  onClick={() => setPasswordForm(prev => ({ ...prev, showForm: true }))}
                  class={`${styles.button} ${styles.buttonSecondary}`}
                >
                  Change Password
                </button>
              </div>
            </Show>
          </div>
        </div>
      }>
        <div class={styles.loading}>
          <LoadingSpinner message="Loading profile..." />
        </div>
      </Show>
    </div>
  )
}