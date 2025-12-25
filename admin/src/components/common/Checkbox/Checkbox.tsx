import { Component, JSX, splitProps, Show } from "solid-js";
import styles from "./Checkbox.module.css";

interface CheckboxProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
}

const Checkbox: Component<CheckboxProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "label",
    "helperText",
    "class",
    "id",
  ]);

  const inputId = () => local.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  const fieldClasses = () => {
    const classList = [styles.field];
    if (local.class) {
      classList.push(local.class);
    }
    return classList.join(" ");
  };

  const labelClasses = () => {
    const classList = [styles.label];
    if (rest.disabled) {
      classList.push(styles.disabled);
    }
    return classList.join(" ");
  };

  return (
    <div>
      <div class={fieldClasses()}>
        <input
          type="checkbox"
          id={inputId()}
          class={styles.checkbox}
          {...rest}
        />
        <Show when={local.label}>
          <label for={inputId()} class={labelClasses()}>
            {local.label}
          </label>
        </Show>
      </div>
      <Show when={local.helperText}>
        <span class={styles.helperText}>{local.helperText}</span>
      </Show>
    </div>
  );
};

export default Checkbox;
