import { Component, JSX, Show } from "solid-js";
import styles from "./Card.module.css";

interface CardProps {
  children: JSX.Element;
  variant?: "primary" | "secondary";
  noBorder?: boolean;
  class?: string;
}

interface CardTitleProps {
  children: JSX.Element;
  size?: "md" | "lg";
}

interface SummaryRowProps {
  label: string;
  value: string | number;
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  onClick?: () => void;
  action?: JSX.Element;
}

interface SelectedItemProps {
  title: string;
  subtitle?: string;
  children?: JSX.Element;
}

interface SectionTitleProps {
  children: JSX.Element;
}

interface ScrollableListProps {
  children: JSX.Element;
  class?: string;
}

interface ItemStackProps {
  children: JSX.Element;
}

export const Card: Component<CardProps> = (props) => {
  const cardClasses = () => {
    const classList = [styles.card];
    if (props.variant === "secondary") {
      classList.push(styles.cardSecondary);
    }
    if (props.noBorder) {
      classList.push(styles.cardNoBorder);
    }
    if (props.class) {
      classList.push(props.class);
    }
    return classList.join(" ");
  };

  return <div class={cardClasses()}>{props.children}</div>;
};

export const CardTitle: Component<CardTitleProps> = (props) => {
  const titleClasses = () => {
    const classList = [styles.title];
    if (props.size === "lg") {
      classList.push(styles.titleLg);
    }
    return classList.join(" ");
  };

  return <h3 class={titleClasses()}>{props.children}</h3>;
};

export const SummaryRow: Component<SummaryRowProps> = (props) => {
  return (
    <div class={styles.summaryRow}>
      <span class={styles.summaryLabel}>{props.label}</span>
      <span class={styles.summaryValue}>{props.value}</span>
    </div>
  );
};

export const SummaryStack: Component<{ children: JSX.Element }> = (props) => {
  return <div class={styles.summaryStack}>{props.children}</div>;
};

export const ListItem: Component<ListItemProps> = (props) => {
  return (
    <div class={styles.listItem} onClick={props.onClick}>
      <div class={styles.listItemContent}>
        <div class={styles.listItemTitle}>{props.title}</div>
        <Show when={props.subtitle}>
          <div class={styles.listItemSubtitle}>{props.subtitle}</div>
        </Show>
      </div>
      <Show when={props.action}>{props.action}</Show>
    </div>
  );
};

export const SelectedItem: Component<SelectedItemProps> = (props) => {
  return (
    <div class={styles.selectedItem}>
      <div class={styles.selectedItemContent}>
        <div class={styles.listItemTitle}>{props.title}</div>
        <Show when={props.subtitle}>
          <div class={styles.listItemSubtitle}>{props.subtitle}</div>
        </Show>
      </div>
      <div class={styles.selectedItemActions}>{props.children}</div>
    </div>
  );
};

export const QuantityControl: Component<{ children: JSX.Element }> = (props) => {
  return <div class={styles.quantityControl}>{props.children}</div>;
};

export const QuantityValue: Component<{ value: number }> = (props) => {
  return <span class={styles.quantityValue}>{props.value}</span>;
};

export const ScrollableList: Component<ScrollableListProps> = (props) => {
  const listClasses = () => {
    const classList = [styles.scrollableList];
    if (props.class) {
      classList.push(props.class);
    }
    return classList.join(" ");
  };

  return <div class={listClasses()}>{props.children}</div>;
};

export const SectionTitle: Component<SectionTitleProps> = (props) => {
  return <h3 class={styles.sectionTitle}>{props.children}</h3>;
};

export const ItemStack: Component<ItemStackProps> = (props) => {
  return <div class={styles.itemStack}>{props.children}</div>;
};

export const ButtonGroup: Component<{ children: JSX.Element }> = (props) => {
  return <div class={styles.buttonGroup}>{props.children}</div>;
};
