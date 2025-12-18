import { Component, JSX, splitProps } from "solid-js";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "text" | "success" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: JSX.Element;
}

const Button: Component<ButtonProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "variant",
    "size",
    "fullWidth",
    "children",
    "class",
  ]);

  const variant = () => local.variant || "primary";
  const size = () => local.size || "md";

  const classes = () => {
    const classList = ["btn-base", `btn-${variant()}`];

    // Text buttons don't need size classes (no padding)
    if (variant() !== "text") {
      classList.push(`btn-${size()}`);
    }

    if (local.fullWidth) {
      classList.push("w-full");
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
