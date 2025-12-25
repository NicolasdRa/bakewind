import { Component, JSX, splitProps, Show } from "solid-js";
import styles from "./Select.module.css";

interface SelectProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

const Select: Component<SelectProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "label",
    "helperText",
    "error",
    "class",
    "children",
  ]);

  const fieldClasses = () => {
    const classList = [styles.field];
    if (local.error) {
      classList.push(styles.error);
    }
    if (local.class) {
      classList.push(local.class);
    }
    return classList.join(" ");
  };

  return (
    <div class={fieldClasses()}>
      <Show when={local.label}>
        <label class={styles.label}>{local.label}</label>
      </Show>
      <select class={styles.select} {...rest}>
        {local.children}
      </select>
      <Show when={local.error}>
        <span class={styles.errorText}>{local.error}</span>
      </Show>
      <Show when={local.helperText && !local.error}>
        <span class={styles.helperText}>{local.helperText}</span>
      </Show>
    </div>
  );
};

export default Select;
