import { Show, JSX } from 'solid-js'
import styles from '../ProfileContent.module.css'

interface FormFieldProps {
  label: string
  value: string | null | undefined
  isEditMode: boolean
  type?: string
  placeholder?: string
  onInput?: (value: string) => void
  children?: JSX.Element
  locked?: boolean
  lockedBadge?: JSX.Element
  fullWidth?: boolean
}

export default function FormField(props: FormFieldProps) {
  const containerClass = () => props.fullWidth ? styles.fieldContainerFull : styles.fieldContainer
  

  return (
    <div class={containerClass()}>
      <label class={styles.label}>
        {props.label}
        {props.lockedBadge}
      </label>

      <Show when={props.locked}>
        <div class={styles.fieldValueLocked}>
          {props.value || 'Not specified'}
        </div>
      </Show>

      <Show when={!props.locked}>
        <Show
          when={props.isEditMode}
          fallback={
            <div class={styles.fieldValue}>
              {props.children || props.value || 'Not specified'}
            </div>
          }
        >
          {props.children || (
            <input
              type={props.type || 'text'}
              value={props.value || ''}
              onInput={(e) => props.onInput?.(e.currentTarget.value)}
              class={styles.input}
              placeholder={props.placeholder}
            />
          )}
        </Show>
      </Show>
    </div>
  )
}