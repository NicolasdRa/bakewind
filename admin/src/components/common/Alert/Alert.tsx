import { Component, JSX, Show } from "solid-js";
import styles from "./Alert.module.css";

export type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: JSX.Element;
  class?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  error: styles.error,
  success: styles.success,
  warning: styles.warning,
  info: styles.info,
};

const Alert: Component<AlertProps> = (props) => {
  const variant = () => props.variant || "error";

  const classes = () => {
    const classList = [styles.alert, variantClasses[variant()]];
    if (props.class) {
      classList.push(props.class);
    }
    return classList.join(" ");
  };

  return (
    <div class={classes()} role="alert">
      <div class={styles.content}>
        <Show when={props.title}>
          <div class={styles.title}>{props.title}</div>
        </Show>
        <div class={styles.message}>{props.children}</div>
      </div>
    </div>
  );
};

export default Alert;
