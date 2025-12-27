import { Component, JSX, splitProps } from "solid-js";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "text" | "subtle" | "success" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  mobileIconOnly?: boolean;
  children: JSX.Element;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  text: styles.text,
  subtle: styles.subtle,
  success: styles.success,
  danger: styles.danger,
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
};

const Button: Component<ButtonProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "variant",
    "size",
    "fullWidth",
    "loading",
    "mobileIconOnly",
    "children",
    "class",
  ]);

  const variant = () => local.variant || "primary";
  const size = () => local.size || "md";

  const classes = () => {
    const classList = [styles.base, variantClasses[variant()]];

    // Text and subtle buttons don't need size classes (custom padding)
    if (variant() !== "text" && variant() !== "subtle") {
      classList.push(sizeClasses[size()]);
    }

    if (local.fullWidth) {
      classList.push(styles.fullWidth);
    }

    if (local.loading) {
      classList.push(styles.loading);
    }

    if (local.mobileIconOnly) {
      classList.push(styles.mobileIconOnly);
    }

    if (local.class) {
      classList.push(local.class);
    }

    return classList.join(" ");
  };

  return (
    <button class={classes()} {...rest}>
      {local.children}
    </button>
  );
};

export default Button;
