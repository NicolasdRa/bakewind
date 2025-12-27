import { Component, JSX, Show, splitProps } from 'solid-js';
import FormMessage from '~/components/common/FormMessage';
import styles from './Form.module.css';

export type FormGap = 'sm' | 'md' | 'lg';

interface FormProps extends JSX.FormHTMLAttributes<HTMLFormElement> {
  gap?: FormGap;
  error?: string;
  children: JSX.Element;
}

const gapClasses: Record<FormGap, string> = {
  sm: styles.gapSm,
  md: styles.gapMd,
  lg: styles.gapLg,
};

const Form: Component<FormProps> = (props) => {
  const [local, rest] = splitProps(props, ['gap', 'error', 'children', 'class']);

  const gap = () => local.gap || 'md';

  const classes = () => {
    const classList = [styles.form, gapClasses[gap()]];
    if (local.class) {
      classList.push(local.class);
    }
    return classList.join(' ');
  };

  return (
    <form class={classes()} {...rest}>
      {local.children}
      <Show when={local.error}>
        <FormMessage variant="error">{local.error}</FormMessage>
      </Show>
    </form>
  );
};

export default Form;
