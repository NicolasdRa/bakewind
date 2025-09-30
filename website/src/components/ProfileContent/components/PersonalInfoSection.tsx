import { Show } from 'solid-js'
import { UserIcon, LockSmallIcon } from '../icons'
import FormField from './FormField'
import type { UpdateProfileData } from '~/queries/useUpdateProfile'
import type { DashboardUserData } from '~/types/auth'
import styles from '../ProfileContent.module.css'

interface PersonalInfoSectionProps {
  formState: UpdateProfileData & { isDirty: boolean }
  isEditMode: boolean
  user: DashboardUserData | undefined
  onUpdateField: (field: keyof UpdateProfileData, value: any) => void
  formatDate: (dateString: string | null | undefined) => string
  formatGender: (gender: string | null | undefined) => string
}

export default function PersonalInfoSection(props: PersonalInfoSectionProps) {
  const { formState, isEditMode, user, onUpdateField, formatDate, formatGender } = props
  console.log("🚀 ~ PersonalInfoSection ~ isEditMode:", isEditMode)

  // Determine field values based on edit mode
  const firstNameValue = isEditMode ? formState.firstName : user?.firstName
  const lastNameValue = isEditMode ? formState.lastName : user?.lastName
  const phoneNumberValue = isEditMode ? formState.phoneNumber : user?.phoneNumber
  const dateOfBirthValue = isEditMode ? formState.dateOfBirth : user?.dateOfBirth
  const genderValue = isEditMode ? formState.gender : user?.gender
  const bioValue = isEditMode ? formState.bio : user?.bio

  return (
    <div class={styles.section}>
      <h2 class={styles.sectionTitle}>
        <div class={styles.sectionIcon}>
          <UserIcon />
        </div>
        Personal Information
      </h2>

      <div class={styles.sectionGrid}>
        <FormField
          label="First Name"
          value={firstNameValue}
          isEditMode={isEditMode}
          placeholder="Enter your first name"
          onInput={(value) => onUpdateField('firstName', value)}
        />

        <FormField
          label="Last Name"
          value={lastNameValue}
          isEditMode={isEditMode}
          placeholder="Enter your last name"
          onInput={(value) => onUpdateField('lastName', value)}
        />

        <FormField
          label="Email Address"
          value={user?.email}
          isEditMode={isEditMode}
          locked={true}
          lockedBadge={
            <span class={styles.lockedBadge}>
              <div class={styles.lockIconSmall}>
                <LockSmallIcon />
              </div>
              Login ID
            </span>
          }
        />

        <FormField
          label="Phone Number"
          value={phoneNumberValue}
          isEditMode={isEditMode}
          type="tel"
          placeholder="Enter your phone number"
          onInput={(value) => onUpdateField('phoneNumber', value)}
        />

        <FormField
          label="Date of Birth"
          value={formatDate(dateOfBirthValue)}
          isEditMode={isEditMode}
          type="date"
          onInput={(value) => onUpdateField('dateOfBirth', value)}
        >
          <Show when={isEditMode}>
            <input
              type="date"
              value={formState.dateOfBirth || ''}
              onInput={(e) => onUpdateField('dateOfBirth', e.currentTarget.value)}
              class={styles.input}
            />
          </Show>
        </FormField>

        <FormField
          label="Gender"
          value={formatGender(genderValue)}
          isEditMode={isEditMode}
        >
          <Show when={isEditMode}>
            <select
              value={formState.gender || ''}
              onChange={(e) => onUpdateField('gender', e.currentTarget.value)}
              class={styles.select}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </Show>
        </FormField>

        <FormField
          label="Bio / About"
          value={bioValue}
          isEditMode={isEditMode}
          fullWidth={true}
          placeholder="Tell us about yourself (max 1000 characters)"
        >
          <Show when={isEditMode}>
            <>
              <textarea
                value={formState.bio || ''}
                onInput={(e) => onUpdateField('bio', e.currentTarget.value)}
                rows={4}
                maxLength={1000}
                class={styles.textarea}
                placeholder="Tell us about yourself (max 1000 characters)"
              />
              <div class={styles.charCounter}>
                {(formState.bio || '').length}/1000 characters
              </div>
            </>
          </Show>
        </FormField>
      </div>
    </div>
  )
}