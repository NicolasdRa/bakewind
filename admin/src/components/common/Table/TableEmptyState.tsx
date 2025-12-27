import { Component, JSX, Show } from "solid-js";
import { Text } from "~/components/common/Typography";
import styles from "./Table.module.css";

interface TableEmptyStateProps {
  message: string;
  icon?: JSX.Element;
  class?: string;
}

/**
 * Empty state display for tables with no data.
 */
const TableEmptyState: Component<TableEmptyStateProps> = (props) => {
  const containerClass = () => {
    return props.class ? `${styles.emptyState} ${props.class}` : styles.emptyState;
  };

  return (
    <div class={containerClass()}>
      <Show when={props.icon}>
        {props.icon}
      </Show>
      <Text color="secondary">{props.message}</Text>
    </div>
  );
};

export default TableEmptyState;
