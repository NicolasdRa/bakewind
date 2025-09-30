import { Show } from 'solid-js'
import { EditIcon } from '../icons'
import styles from '../ProfileContent.module.css'

interface ProfileHeaderProps {
  isEditMode: boolean
  saveMessage: string
  isUpdating: boolean
  onEnterEditMode: () => void
  onCancelEdit: () => void
  onSaveProfile: () => void
}

export default function ProfileHeader(props: ProfileHeaderProps) {
  return (
    <div class={styles.header}>
      <div>
        <h1 class={styles.title}>Profile Settings</h1>
        <Show when={!props.isEditMode}>
          <p class={styles.subtitle}>View and manage your personal information</p>
        </Show>
        <Show when={props.isEditMode}>
          <p class={styles.editingSubtitle}>Editing profile information</p>
        </Show>
      </div>

      <div class={styles.headerActions}>
        <Show when={props.saveMessage}>
          <div class={styles.successMessage}>
            {props.saveMessage}
          </div>
        </Show>

        <Show when={!props.isEditMode}>
          <button
            onClick={props.onEnterEditMode}
            class={styles.editButton}
          >
            <div class={styles.editIcon}>
              <EditIcon />
            </div>
            Edit Profile
          </button>
        </Show>

        <Show when={props.isEditMode}>
          <div class={styles.editActions}>
            <button
              onClick={props.onCancelEdit}
              class={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              onClick={props.onSaveProfile}
              disabled={props.isUpdating}
              class={styles.saveButton}
            >
              {props.isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Show>
      </div>
    </div>
  )
}