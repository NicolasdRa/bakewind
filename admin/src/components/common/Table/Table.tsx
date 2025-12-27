import { Component, JSX } from "solid-js";
import styles from "./Table.module.css";

interface TableProps {
  children: JSX.Element;
  class?: string;
}

/**
 * Base table element with proper border-collapse and min-width.
 */
const Table: Component<TableProps> = (props) => {
  const tableClass = () => {
    return props.class ? `${styles.table} ${props.class}` : styles.table;
  };

  return (
    <table class={tableClass()}>
      {props.children}
    </table>
  );
};

export default Table;
