import { Component, JSX, Show } from 'solid-js';
import { Text } from '~/components/common/Typography';
import styles from './FormMessage.module.css';

export type FormMessageVariant = 'error' | 'success' | 'warning' | 'info';

interface FormMessageProps {
  variant: FormMessageVariant;
  title?: string;
  children: JSX.Element;
}

const variantClasses: Record<FormMessageVariant, string> = {
  error: styles.error,
  success: styles.success,
  warning: styles.warning,
  info: styles.info,
};

const FormMessage: Component<FormMessageProps> = (props) => {
  return (
    <div class={`${styles.base} ${variantClasses[props.variant]}`}>
      <Show when={props.title}>
        <Text variant="body" class={styles.title}>{props.title}</Text>
      </Show>
      <Text variant="body-sm" class={styles.message}>{props.children}</Text>
    </div>
  );
};

export default FormMessage;
