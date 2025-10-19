import { createSignal, Show } from 'solid-js'
import { useAuth } from '~/context/AuthContext'
import { API_BASE_URL } from '~/config/constants'
import BaseWidget from '~/components/BaseWidget/BaseWidget'
import styles from './ProfileInfoWidget.module.css'

interface ProfileInfoWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function ProfileInfoWidget(props: ProfileInfoWidgetProps) {
  const auth = useAuth()
  const user = () => auth.user

  const [isEditing, setIsEditing] = createSignal(false)
  const [isUpdating, setIsUpdating] = createSignal(false)
  const [updateError, setUpdateError] = createSignal<string | null>(null)

  interface FormData {
    firstName: string
    lastName: string
    phoneNumber: string
    bio: string
    city: string
    country: string
  }

  const [formData, setFormData] = createSignal<FormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    bio: '',
    city: '',
    country: ''
  })

  const handleEdit = () => {
    const currentUser = user()
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        phoneNumber: '',
        bio: '',
        city: '',
        country: ''
      })
    }
    setUpdateError(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setUpdateError(null)
    setIsEditing(false)
  }

  const handleSubmit = async (event: Event) => {
    event.preventDefault()
    setIsUpdating(true)
    setUpdateError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData())
      })

      if (!response.ok) throw new Error('Failed to update profile')

      setIsEditing(false)
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Update failed')
    } finally {
      setIsUpdating(false)
    }
  }

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <BaseWidget {...props}>
      <div class={styles.container}>
        <div class={styles.header}>
          {!isEditing() ? (
            <button onClick={handleEdit} class={styles.editButton}>
              Edit Profile
            </button>
          ) : (
            <div class={styles.actionButtons}>
              <button
                onClick={handleCancel}
                class={styles.cancelButton}
                disabled={isUpdating()}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="profile-widget-form"
                class={styles.saveButton}
                disabled={isUpdating()}
              >
                {isUpdating() ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <Show when={updateError()}>
          <div class={styles.errorMessage}>{updateError()}</div>
        </Show>

        <div class={styles.profileContent}>
          <div class={styles.avatarSection}>
            <div class={styles.avatar}>
              {(() => {
                const currentUser = user()
                const displayName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email || '??'
                return displayName.substring(0, 2).toUpperCase()
              })()}
            </div>
          </div>

          <Show
            when={isEditing()}
            fallback={
              <div class={styles.profileDetails}>
                <div class={styles.fieldGroup}>
                  <label class={styles.fieldLabel}>Name</label>
                  <p class={styles.fieldValue}>
                    {`${user()?.firstName || ''} ${user()?.lastName || ''}`.trim() || <span class={styles.placeholder}>No name provided</span>}
                  </p>
                </div>

                <div class={styles.fieldGroup}>
                  <label class={styles.fieldLabel}>Email</label>
                  <p class={styles.fieldValue}>
                    {user()?.email || <span class={styles.placeholder}>No email</span>}
                  </p>
                </div>

                <div class={styles.fieldGroup}>
                  <label class={styles.fieldLabel}>Role</label>
                  <p class={styles.fieldValue}>
                    {user()?.role?.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'No role'}
                  </p>
                </div>
              </div>
            }
          >
            <form id="profile-widget-form" onSubmit={handleSubmit} class={styles.profileDetails}>
              <div class={styles.fieldGroup}>
                <label class={styles.fieldLabel}>First Name</label>
                <input
                  type="text"
                  value={formData().firstName}
                  onInput={(e) => updateField('firstName', e.currentTarget.value)}
                  placeholder="Enter first name"
                  class={styles.fieldInput}
                />
              </div>

              <div class={styles.fieldGroup}>
                <label class={styles.fieldLabel}>Last Name</label>
                <input
                  type="text"
                  value={formData().lastName}
                  onInput={(e) => updateField('lastName', e.currentTarget.value)}
                  placeholder="Enter last name"
                  class={styles.fieldInput}
                />
              </div>
            </form>
          </Show>
        </div>
      </div>
    </BaseWidget>
  )
}
