import { Component, JSX } from "solid-js";
import styles from "./Table.module.css";

interface TableHeadProps {
  children: JSX.Element;
  class?: string;
}

/**
 * Table header element with background styling.
 */
const TableHead: Component<TableHeadProps> = (props) => {
  const headClass = () => {
    return props.class ? `${styles.head} ${props.class}` : styles.head;
  };

  return (
    <thead class={headClass()}>
      {props.children}
    </thead>
  );
};

export default TableHead;
