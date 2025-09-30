import { LocationIcon } from '../icons'
import FormField from './FormField'
import type { UpdateProfileData } from '~/queries/useUpdateProfile'
import type { DashboardUserData } from '~/types/auth'
import styles from '../ProfileContent.module.css'

interface LocationSectionProps {
  formState: UpdateProfileData & { isDirty: boolean }
  isEditMode: boolean
  user: DashboardUserData | undefined
  onUpdateField: (field: keyof UpdateProfileData, value: any) => void
}

export default function LocationSection(props: LocationSectionProps) {
  const { formState, isEditMode, user, onUpdateField } = props

  // Determine field values based on edit mode
  const countryValue = isEditMode ? formState.country : user?.country
  const cityValue = isEditMode ? formState.city : user?.city

  return (
    <div class={styles.section}>
      <h2 class={styles.sectionTitle}>
        <div class={styles.sectionIcon}>
          <LocationIcon />
        </div>
        Location Information
      </h2>

      <div class={styles.sectionGrid}>
        <FormField
          label="Country"
          value={countryValue}
          isEditMode={isEditMode}
          placeholder="Enter your country"
          onInput={(value) => onUpdateField('country', value)}
        />

        <FormField
          label="City"
          value={cityValue}
          isEditMode={isEditMode}
          placeholder="Enter your city"
          onInput={(value) => onUpdateField('city', value)}
        />
      </div>
    </div>
  )
}