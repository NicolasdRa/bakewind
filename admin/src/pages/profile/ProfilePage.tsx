import { Component, createSignal, createEffect, createMemo, Show } from "solid-js"
import { useAuth } from "~/stores/authStore"
import { API_BASE_URL } from "~/config/constants"
import LoadingSpinner from "~/components/LoadingSpinner/LoadingSpinner"
import styles from './ProfilePage.module.css'

// Type Definitions
interface UpdateProfileData {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  bio?: string
  gender?: string
  dateOfBirth?: string
  country?: string
  city?: string
  profilePictureUrl?: string
}

interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface FormState extends UpdateProfileData {
  isDirty: boolean
}

interface PasswordForm extends ChangePasswordData {
  showForm: boolean
}


// Simple inline hooks for profile management
const useUpdateProfile = () => {
  const [isLoading, setIsLoading] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  const updateProfile = async (data: Partial<UpdateProfileData>) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update profile')
      return await response.json()
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { updateProfile, isLoading, error }
}

const useChangePassword = () => {
  const [isLoading, setIsLoading] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  const changePassword = async (userId: string, data: ChangePasswordData) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      })
      if (!response.ok) throw new Error('Failed to change password')
      return await response.json()
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { changePassword, isLoading, error }
}

const ProfilePage: Component = () => {
  const auth = useAuth()
  const user = () => auth.user
  const { updateProfile, isLoading: isUpdating, error: updateError } = useUpdateProfile()
  const { changePassword, isLoading: isChangingPassword, error: passwordError } = useChangePassword()

  // UI State
  const [isEditMode, setIsEditMode] = createSignal(false)
  const [isLoading, setIsLoading] = createSignal(true)
  const [saveMessage, setSaveMessage] = createSignal<string>('')

  // Track original values to detect changes
  const [originalValues, setOriginalValues] = createSignal<UpdateProfileData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    bio: '',
    gender: '',
    dateOfBirth: '',
    country: '',
    city: '',
    profilePictureUrl: ''
  })

  const [formState, setFormState] = createSignal<FormState>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    bio: '',
    gender: '',
    dateOfBirth: '',
    country: '',
    city: '',
    profilePictureUrl: '',
    isDirty: false
  })

  // Initialize form with user data when user changes
  createEffect(() => {
    const currentUser = user()
    if (currentUser) {
      const initialData = {
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        phoneNumber: '',
        bio: '',
        gender: '',
        dateOfBirth: '',
        country: '',
        city: '',
        profilePictureUrl: ''
      }

      setOriginalValues(initialData)
      setFormState({
        ...initialData,
        isDirty: false
      })
      setIsLoading(false)
    }
  })

  const [passwordForm, setPasswordForm] = createSignal<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showForm: false
  })

  const updateFormField = (field: keyof UpdateProfileData, value: any) => {
    setFormState(prev => {
      const newState = {
        ...prev,
        [field]: value
      }

      // Check if any field is different from original
      const original = originalValues()
      const isDirty = Object.keys(original).some(key => {
        const k = key as keyof UpdateProfileData
        return newState[k] !== original[k]
      })

      return {
        ...newState,
        isDirty
      }
    })
  }

  const updatePasswordField = (field: keyof ChangePasswordData, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const togglePasswordForm = () => {
    setPasswordForm(prev => ({
      ...prev,
      showForm: !prev.showForm,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }))
  }

  const handleEnterEditMode = () => {
    setIsEditMode(true)
    setSaveMessage('')
  }

  const handleCancelEdit = () => {
    // Reset to original values
    setFormState({
      ...originalValues(),
      isDirty: false
    })
    setIsEditMode(false)
    setSaveMessage('')
  }

  const handleSaveProfile = async () => {
    if (!formState().isDirty) {
      setIsEditMode(false)
      return
    }

    try {
      const { isDirty, ...currentData } = formState()
      const original = originalValues()

      // Only send fields that have changed
      const changedFields: Partial<UpdateProfileData> = {}

      Object.keys(currentData).forEach(key => {
        const k = key as keyof UpdateProfileData
        if (currentData[k] !== original[k]) {
          if (currentData[k] || original[k]) {
            changedFields[k] = currentData[k] as any
          }
        }
      })

      // Only send the update if there are actual changes
      if (Object.keys(changedFields).length > 0) {
        await updateProfile(changedFields)

        // Update original values with new values after successful save
        setOriginalValues(currentData)
        setFormState(prev => ({ ...prev, isDirty: false }))
        setSaveMessage('Profile updated successfully!')
        setIsEditMode(false)
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleChangePassword = async () => {
    const form = passwordForm()
    const currentUser = user()
    if (!currentUser || form.newPassword !== form.confirmPassword) return

    try {
      await changePassword(currentUser.id, form)
      togglePasswordForm()
      setSaveMessage('Password changed successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Failed to change password:', error)
    }
  }

  const getRoleBadgeClass = () => {
    const currentUser = user()
    if (!currentUser?.role) return styles.roleBadgeGray
    const role = currentUser.role.toLowerCase()
    switch (role) {
      case 'admin': return styles.roleBadgeRed
      case 'manager': return styles.roleBadgeBlue
      case 'head_baker':
      case 'head_pastry_chef': return styles.roleBadgeGreen
      case 'baker':
      case 'pastry_chef': return styles.roleBadgeYellow
      case 'cashier': return styles.roleBadgeOrange
      default: return styles.roleBadgeGray
    }
  }

  const getRoleDescription = () => {
    const currentUser = user()
    if (!currentUser?.role) return 'No role assigned'
    const role = currentUser.role.toLowerCase()
    switch (role) {
      case 'admin': return 'Full system access and user management'
      case 'manager': return 'Location management and reporting'
      case 'head_baker': return 'Bakery operations and team lead'
      case 'head_pastry_chef': return 'Pastry operations and team lead'
      case 'baker': return 'Bread and bakery production'
      case 'pastry_chef': return 'Pastry and dessert production'
      case 'cashier': return 'Customer service and sales'
      case 'viewer': return 'Read-only access to assigned areas'
      default: return 'Custom role permissions'
    }
  }

  const passwordsMatch = createMemo(() => {
    const form = passwordForm()
    return form.newPassword === form.confirmPassword
  })

  const isPasswordFormValid = createMemo(() => {
    const form = passwordForm()
    return form.currentPassword &&
           form.newPassword &&
           form.confirmPassword &&
           passwordsMatch() &&
           form.newPassword.length >= 6
  })

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Not specified'
    }
  }

  const formatGender = (gender: string | null | undefined) => {
    if (!gender) return 'Not specified'
    return gender.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div class={styles.grid}>
      <div class={styles.profileInfoContainer}>
        <div class={styles.container}>
          <Show when={isLoading()}>
            <div class={styles.loadingContainer}>
              <LoadingSpinner message="Loading profile..." />
            </div>
          </Show>

          <Show when={!isLoading() && user()}>
            {/* Header with Edit/Save Actions */}
            <div class={styles.header}>
              <div class={styles.headerContent}>
                <h1 class={styles.title}>Profile Settings</h1>
                <Show when={!isEditMode()}>
                  <p class={styles.subtitle}>View and manage your personal information</p>
                </Show>
                <Show when={isEditMode()}>
                  <p class={styles.editingSubtitle}>Editing profile information</p>
                </Show>
              </div>

              <div class={styles.headerActions}>
                <Show when={saveMessage()}>
                  <div class={styles.successMessage}>
                    {saveMessage()}
                  </div>
                </Show>

                <Show when={!isEditMode()}>
                  <button
                    onClick={handleEnterEditMode}
                    class={styles.editButton}
                  >
                    <svg class={styles.editIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                </Show>

                <Show when={isEditMode()}>
                  <div class={styles.editActions}>
                    <button
                      onClick={handleCancelEdit}
                      class={styles.cancelButton}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isUpdating()}
                      class={styles.saveButton}
                    >
                      {isUpdating() ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </Show>
              </div>
            </div>

            {/* Personal Information Section */}
            <div class={styles.section}>
              <h2 class={styles.sectionTitle}>
                <svg class={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Information
              </h2>

              <div class={styles.sectionGrid}>
                {/* First Name */}
                <div class={styles.fieldContainer}>
                  <label class={styles.label}>First Name</label>
                  <Show
                    when={isEditMode()}
                    fallback={
                      <div class={styles.fieldValue}>
                        {formState().firstName || 'Not specified'}
                      </div>
                    }
                  >
                    <input
                      type="text"
                      value={formState().firstName}
                      onInput={(e) => updateFormField('firstName', e.currentTarget.value)}
                      class={styles.input}
                      placeholder="Enter your first name"
                    />
                  </Show>
                </div>

                {/* Last Name */}
                <div class={styles.fieldContainer}>
                  <label class={styles.label}>Last Name</label>
                  <Show
                    when={isEditMode()}
                    fallback={
                      <div class={styles.fieldValue}>
                        {formState().lastName || 'Not specified'}
                      </div>
                    }
                  >
                    <input
                      type="text"
                      value={formState().lastName}
                      onInput={(e) => updateFormField('lastName', e.currentTarget.value)}
                      class={styles.input}
                      placeholder="Enter your last name"
                    />
                  </Show>
                </div>

                {/* Email (Always Read-only) */}
                <div class={styles.fieldContainer}>
                  <label class={styles.label}>
                    Email Address
                    <span class={styles.lockedBadge}>
                      <svg class={styles.lockIconSmall} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                      Login ID
                    </span>
                  </label>
                  <div class={styles.fieldValueLocked}>
                    {user()?.email || 'No email provided'}
                  </div>
                </div>

                {/* Phone Number */}
                <div class={styles.fieldContainer}>
                  <label class={styles.label}>Phone Number</label>
                  <Show
                    when={isEditMode()}
                    fallback={
                      <div class={styles.fieldValue}>
                        {formState().phoneNumber || 'Not specified'}
                      </div>
                    }
                  >
                    <input
                      type="tel"
                      value={formState().phoneNumber || ''}
                      onInput={(e) => updateFormField('phoneNumber', e.currentTarget.value)}
                      class={styles.input}
                      placeholder="Enter your phone number"
                    />
                  </Show>
                </div>

                {/* Date of Birth */}
                <div class={styles.fieldContainer}>
                  <label class={styles.label}>Date of Birth</label>
                  <Show
                    when={isEditMode()}
                    fallback={
                      <div class={styles.fieldValue}>
                        {formatDate(formState().dateOfBirth)}
                      </div>
                    }
                  >
                    <input
                      type="date"
                      value={formState().dateOfBirth || ''}
                      onInput={(e) => updateFormField('dateOfBirth', e.currentTarget.value)}
                      class={styles.input}
                    />
                  </Show>
                </div>

                {/* Gender */}
                <div class={styles.fieldContainer}>
                  <label class={styles.label}>Gender</label>
                  <Show
                    when={isEditMode()}
                    fallback={
                      <div class={styles.fieldValue}>
                        {formatGender(formState().gender)}
                      </div>
                    }
                  >
                    <select
                      value={formState().gender || ''}
                      onChange={(e) => updateFormField('gender', e.currentTarget.value)}
                      class={styles.select}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </Show>
                </div>

                {/* Bio - Full Width */}
                <div class={styles.fieldContainerFull}>
                  <label class={styles.label}>Bio / About</label>
                  <Show
                    when={isEditMode()}
                    fallback={
                      <div class={styles.fieldValue}>
                        {formState().bio || 'No bio provided'}
                      </div>
                    }
                  >
                    <textarea
                      value={formState().bio || ''}
                      onInput={(e) => updateFormField('bio', e.currentTarget.value)}
                      rows={4}
                      maxLength={1000}
                      class={styles.textarea}
                      placeholder="Tell us about yourself (max 1000 characters)"
                    />
                    <div class={styles.charCounter}>
                      {(formState().bio || '').length}/1000 characters
                    </div>
                  </Show>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div class={styles.section}>
              <h2 class={styles.sectionTitle}>
                <svg class={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location Information
              </h2>

              <div class={styles.sectionGrid}>
                {/* Country */}
                <div class={styles.fieldContainer}>
                  <label class={styles.label}>Country</label>
                  <Show
                    when={isEditMode()}
                    fallback={
                      <div class={styles.fieldValue}>
                        {formState().country || 'Not specified'}
                      </div>
                    }
                  >
                    <input
                      type="text"
                      value={formState().country || ''}
                      onInput={(e) => updateFormField('country', e.currentTarget.value)}
                      class={styles.input}
                      placeholder="Enter your country"
                    />
                  </Show>
                </div>

                {/* City */}
                <div class={styles.fieldContainer}>
                  <label class={styles.label}>City</label>
                  <Show
                    when={isEditMode()}
                    fallback={
                      <div class={styles.fieldValue}>
                        {formState().city || 'Not specified'}
                      </div>
                    }
                  >
                    <input
                      type="text"
                      value={formState().city || ''}
                      onInput={(e) => updateFormField('city', e.currentTarget.value)}
                      class={styles.input}
                      placeholder="Enter your city"
                    />
                  </Show>
                </div>
              </div>
            </div>

            {/* Professional Information (Always Read-only) */}
            <div class={styles.section}>
              <h2 class={styles.sectionTitle}>
                <svg class={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Professional Information
              </h2>

              {/* Role Badge */}
              <div class={styles.infoCard}>
                <label class={styles.label}>Role & Permissions</label>
                <div class={styles.roleContainer}>
                  <span class={getRoleBadgeClass()}>
                    {user()?.role?.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'No Role'}
                  </span>
                  <p class={styles.roleDescription}>
                    {getRoleDescription()}
                  </p>
                </div>
              </div>

              {/* Account Status */}
              <div class={styles.infoCard}>
                <label class={styles.label}>Account Status</label>
                <div class={styles.statusContainer}>
                  <span class={styles.statusBadgeActive}>
                    <span class={styles.statusDot}></span>
                    Active
                  </span>
                  <span class={user()?.isEmailVerified ? styles.statusBadgeVerified : styles.statusBadgeUnverified}>
                    <svg class={styles.statusIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {user()?.isEmailVerified ? (
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    {user()?.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div class={styles.section}>
              <h2 class={styles.sectionTitle}>
                <svg class={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Account Security
              </h2>

              <div class={styles.securityCard}>
                <Show when={!passwordForm().showForm}>
                  <button
                    onClick={togglePasswordForm}
                    class={styles.changePasswordButton}
                  >
                    <svg class={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password
                  </button>
                </Show>

                <Show when={passwordForm().showForm}>
                  <div class={styles.passwordForm}>
                    <h3 class={styles.passwordFormTitle}>Change Your Password</h3>

                    <div class={styles.passwordField}>
                      <label class={styles.label}>Current Password</label>
                      <input
                        type="password"
                        value={passwordForm().currentPassword}
                        onInput={(e) => updatePasswordField('currentPassword', e.currentTarget.value)}
                        class={styles.input}
                        placeholder="Enter your current password"
                      />
                    </div>

                    <div class={styles.passwordField}>
                      <label class={styles.label}>New Password (min 6 characters)</label>
                      <input
                        type="password"
                        value={passwordForm().newPassword}
                        onInput={(e) => updatePasswordField('newPassword', e.currentTarget.value)}
                        class={styles.input}
                        placeholder="Enter a new password"
                      />
                    </div>

                    <div class={styles.passwordField}>
                      <label class={styles.label}>Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm().confirmPassword}
                        onInput={(e) => updatePasswordField('confirmPassword', e.currentTarget.value)}
                        class={`${styles.input} ${passwordForm().confirmPassword && !passwordsMatch() ? styles.inputError : ''}`}
                        placeholder="Confirm your new password"
                      />
                      <Show when={passwordForm().confirmPassword && !passwordsMatch()}>
                        <p class={styles.validationError}>Passwords do not match</p>
                      </Show>
                    </div>

                    <div class={styles.passwordFormActions}>
                      <button
                        onClick={togglePasswordForm}
                        class={styles.cancelButton}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleChangePassword}
                        disabled={!isPasswordFormValid() || isChangingPassword()}
                        class={styles.dangerButton}
                      >
                        {isChangingPassword() ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>

                    <Show when={passwordError()}>
                      <p class={styles.validationError}>{passwordError()?.message}</p>
                    </Show>
                  </div>
                </Show>
              </div>
            </div>

            {/* Error Display */}
            <Show when={updateError()}>
              <div class={styles.errorMessage}>
                {updateError()?.message}
              </div>
            </Show>
          </Show>
        </div>
      </div>
    </div>
  )
};

export default ProfilePage;