import { Component, Show } from "solid-js";
import { Text } from "~/components/common/Typography";
import styles from "./Table.module.css";

interface TableLoadingStateProps {
  message?: string;
  class?: string;
}

/**
 * Loading state with spinner for tables.
 */
const TableLoadingState: Component<TableLoadingStateProps> = (props) => {
  const containerClass = () => {
    return props.class ? `${styles.loadingContainer} ${props.class}` : styles.loadingContainer;
  };

  return (
    <div class={containerClass()}>
      <div class={styles.spinner} />
      <Show when={props.message}>
        <Text color="secondary">{props.message}</Text>
      </Show>
    </div>
  );
};

export default TableLoadingState;
