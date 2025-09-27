import { JSX } from 'solid-js'
import styles from './ActionButton.module.css'

export type ActionButtonVariant = 'primary' | 'secondary'
export type ActionButtonSize = 'sm' | 'md' | 'lg'

interface ActionButtonProps {
  children: JSX.Element
  onClick?: () => void
  variant?: ActionButtonVariant
  size?: ActionButtonSize
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: string
  title?: string
  icon?: string
  iconPosition?: 'left' | 'right'
  hideTextOnMobile?: boolean
}

export default function ActionButton(props: ActionButtonProps) {
  const variant = () => props.variant || 'primary'
  const size = () => props.size || 'md'
  
  return (
    <button
      type={props.type || 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title}
      class={`${styles.actionButton} ${styles[variant()]} ${styles[size()]} ${props.class || ''}`}
      classList={{
        [styles.disabled]: props.disabled
      }}
    >
      {props.icon && props.iconPosition !== 'right' && (
        <span class={`${styles.icon} ${styles.iconLeft}`}>
          {props.icon}
        </span>
      )}
      
      <span 
        class={styles.text}
        classList={{
          [styles.textHiddenMobile]: props.hideTextOnMobile
        }}
      >
        {props.children}
      </span>
      
      {props.icon && props.iconPosition === 'right' && (
        <span class={`${styles.icon} ${styles.iconRight}`}>
          {props.icon}
        </span>
      )}
    </button>
  )
}