import { BriefcaseIcon, CheckCircleIcon, ExclamationCircleIcon } from '../icons'
import styles from '../ProfileContent.module.css'

interface ProfessionalSectionProps {
  role: string | undefined
  isActive: boolean | undefined
  isEmailVerified: boolean | undefined
  getRoleBadgeClass: () => string
  getRoleDescription: () => string
}

export default function ProfessionalSection(props: ProfessionalSectionProps) {
  return (
    <div class={styles.section}>
      <h2 class={styles.sectionTitle}>
        <div class={styles.sectionIcon}>
          <BriefcaseIcon />
        </div>
        Professional Information
      </h2>

      <div class={styles.infoCard}>
        <label class={styles.label}>Role & Permissions</label>
        <div class={styles.roleContainer}>
          <span class={props.getRoleBadgeClass()}>
            {props.role?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'No Role'}
          </span>
          <p class={styles.roleDescription}>
            {props.getRoleDescription()}
          </p>
        </div>
      </div>

      <div class={styles.infoCard}>
        <label class={styles.label}>Account Status</label>
        <div class={styles.statusContainer}>
          <span class={props.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive}>
            <span class={styles.statusDot}></span>
            {props.isActive ? 'Active' : 'Inactive'}
          </span>
          <span class={props.isEmailVerified ? styles.statusBadgeVerified : styles.statusBadgeUnverified}>
            <div class={styles.statusIcon}>
              {props.isEmailVerified ? <CheckCircleIcon /> : <ExclamationCircleIcon />}
            </div>
            {props.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
          </span>
        </div>
      </div>
    </div>
  )
}