import { Component, JSX } from "solid-js";
import styles from "./Table.module.css";

interface TableContainerProps {
  children: JSX.Element;
  class?: string;
}

/**
 * Container wrapper for tables with border, shadow, and overflow handling.
 */
const TableContainer: Component<TableContainerProps> = (props) => {
  const containerClass = () => {
    return props.class ? `${styles.container} ${props.class}` : styles.container;
  };

  return (
    <div class={containerClass()}>
      <div class={styles.wrapper}>
        {props.children}
      </div>
    </div>
  );
};

export default TableContainer;
