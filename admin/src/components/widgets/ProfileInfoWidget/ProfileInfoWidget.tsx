import { createSignal, Show } from 'solid-js'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useProfileMutations } from '~/hooks/useProfileMutations'
import styles from './ProfileInfoWidget.module.css'

export default function ProfileInfoWidget() {
  const { user, loading } = useCurrentUser()
  const { updateProfile, isUpdating, updateError, clearError } = useProfileMutations()
  const [isEditing, setIsEditing] = createSignal(false)


  const handleEdit = () => {
    clearError()
    setIsEditing(true)
  }

  const handleCancel = () => {
    clearError()
    setIsEditing(false)
  }

  const handleSubmit = async (event: Event) => {
    event.preventDefault()

    const form = event.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      await updateProfile({
        firstName: formData.get('firstName') as string || undefined,
        lastName: formData.get('lastName') as string || undefined,
        phoneNumber: formData.get('phoneNumber') as string || undefined,
        bio: formData.get('bio') as string || undefined,
        city: formData.get('city') as string || undefined,
        country: formData.get('country') as string || undefined
      })

      setIsEditing(false)
    } catch (error) {
      // Error is handled by the hook
      console.error('Profile update failed:', error)
    }
  }

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <h3 class={styles.title}>Profile Information</h3>
        {!isEditing() ? (
          <button
            onClick={handleEdit}
            class={styles.editButton}
          >
            Edit Profile
          </button>
        ) : (
          <div class={styles.actionButtons}>
            <button
              onClick={handleCancel}
              class={styles.cancelButton}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="profile-form"
              class={styles.saveButton}
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      <Show when={updateError}>
        <div class={styles.errorMessage}>
          {updateError}
        </div>
      </Show>

      <div class={styles.profileContent}>
        {/* Profile Avatar */}
        <div class={styles.avatarSection}>
          <div class={styles.avatar}>
            {(() => {
              const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '??'
              return displayName.substring(0, 2).toUpperCase()
            })()
          </div>
          {isEditing() && (
            <button class={styles.avatarButton}>
              Change Avatar
            </button>
          )}
        </div>

        {/* Profile Details */}
        <Show 
          when={isEditing()}
          fallback={
            <div class={styles.profileDetails}>
              <div class={styles.fieldGrid}>
                <div class={styles.fieldGroup}>
                  <label class={styles.fieldLabel}>First Name</label>
                  <p class={styles.fieldValue}>
                    {user?.firstName || <span class={styles.placeholder}>No first name provided</span>}
                  </p>
                </div>
                <div class={styles.fieldGroup}>
                  <label class={styles.fieldLabel}>Last Name</label>
                  <p class={styles.fieldValue}>
                    {user?.lastName || <span class={styles.placeholder}>No last name provided</span>}
                  </p>
                </div>
              </div>

              <div class={styles.fieldGroup}>
                <label class={styles.fieldLabel}>Email</label>
                <p class={styles.fieldValue}>
                  {user?.email || <span class={styles.placeholder}>No email provided</span>}
                </p>
              </div>

              <div class={styles.fieldGroup}>
                <label class={styles.fieldLabel}>Phone Number</label>
                <p class={styles.fieldValue}>
                  {user?.phoneNumber || <span class={styles.placeholder}>No phone number provided</span>}
                </p>
              </div>

              <div class={styles.fieldGroup}>
                <label class={styles.fieldLabel}>Bio</label>
                <p class={styles.fieldValue}>
                  {user?.bio || <span class={styles.placeholder}>No bio provided</span>}
                </p>
              </div>

              <div class={styles.fieldGrid}>
                <div class={styles.fieldGroup}>
                  <label class={styles.fieldLabel}>City</label>
                  <p class={styles.fieldValue}>
                    {user?.city || <span class={styles.placeholder}>No city provided</span>}
                  </p>
                </div>
                <div class={styles.fieldGroup}>
                  <label class={styles.fieldLabel}>Country</label>
                  <p class={styles.fieldValue}>
                    {user?.country || <span class={styles.placeholder}>No country provided</span>}
                  </p>
                </div>
              </div>
            </div>
          }
        >
          <form id="profile-form" onSubmit={handleSubmit} class={styles.profileDetails}>
            <div class={styles.fieldGrid}>
              <div class={styles.fieldGroup}>
                <label class={styles.fieldLabel}>First Name</label>
                <input
                  name="firstName"
                  type="text"
                  value={user?.firstName || ''}
                  placeholder="Enter your first name"
                  class={styles.fieldInput}
                />
              </div>
              <div class={styles.fieldGroup}>
                <label class={styles.fieldLabel}>Last Name</label>
                <input
                  name="lastName"
                  type="text"
                  value={user?.lastName || ''}
                  placeholder="Enter your last name"
                  class={styles.fieldInput}
                />
              </div>
            </div>

            <div class={styles.fieldGroup}>
              <label class={styles.fieldLabel}>Phone Number</label>
              <input
                name="phoneNumber"
                type="tel"
                value={user?.phoneNumber || ''}
                placeholder="Enter your phone number"
                class={styles.fieldInput}
              />
            </div>

            <div class={styles.fieldGroup}>
              <label class={styles.fieldLabel}>Bio</label>
              <textarea
                name="bio"
                value={user?.bio || ''}
                placeholder="Tell us about yourself..."
                rows={3}
                class={styles.fieldTextarea}
              />
            </div>

            <div class={styles.fieldGrid}>
              <div class={styles.fieldGroup}>
                <label class={styles.fieldLabel}>City</label>
                <input
                  name="city"
                  type="text"
                  value={user?.city || ''}
                  placeholder="Your city"
                  class={styles.fieldInput}
                />
              </div>
              <div class={styles.fieldGroup}>
                <label class={styles.fieldLabel}>Country</label>
                <input
                  name="country"
                  type="text"
                  value={user?.country || ''}
                  placeholder="Your country"
                  class={styles.fieldInput}
                />
              </div>
            </div>
          </form>
        </Show>
      </div>
    </div>
  )
}