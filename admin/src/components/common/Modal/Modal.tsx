import { Component, JSX, Show, splitProps } from "solid-js";
import styles from "./Modal.module.css";

type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  children: JSX.Element;
}

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  children?: JSX.Element;
}

interface ModalBodyProps {
  children: JSX.Element;
  class?: string;
}

interface ModalFooterProps {
  children: JSX.Element;
  spaceBetween?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: styles.containerSm,
  md: styles.containerMd,
  lg: styles.containerLg,
  xl: styles.containerXl,
};

export const Modal: Component<ModalProps> = (props) => {
  const containerClasses = () => {
    return `${styles.container} ${sizeClasses[props.size || "md"]}`;
  };

  return (
    <Show when={props.isOpen}>
      <div class={styles.overlay} onClick={props.onClose}>
        <div class={containerClasses()} onClick={(e) => e.stopPropagation()}>
          {props.children}
        </div>
      </div>
    </Show>
  );
};

export const ModalHeader: Component<ModalHeaderProps> = (props) => {
  return (
    <div class={styles.header}>
      <div class={styles.headerContent}>
        <h2 class={styles.title}>{props.title}</h2>
        <Show when={props.subtitle}>
          <p class={styles.subtitle}>{props.subtitle}</p>
        </Show>
        {props.children}
      </div>
      <Show when={props.onClose}>
        <button
          type="button"
          class={styles.closeButton}
          onClick={props.onClose}
          aria-label="Close modal"
        >
          ×
        </button>
      </Show>
    </div>
  );
};

export const ModalBody: Component<ModalBodyProps> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class"]);

  const bodyClasses = () => {
    return local.class ? `${styles.body} ${local.class}` : styles.body;
  };

  return (
    <div class={bodyClasses()} {...rest}>
      {local.children}
    </div>
  );
};

export const ModalFooter: Component<ModalFooterProps> = (props) => {
  const footerClasses = () => {
    const classList = [styles.footer];
    if (props.spaceBetween) {
      classList.push(styles.footerSpaceBetween);
    }
    return classList.join(" ");
  };

  return <div class={footerClasses()}>{props.children}</div>;
};
