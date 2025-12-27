import { Component, JSX } from "solid-js";
import styles from "./Table.module.css";

interface TableRowProps {
  children: JSX.Element;
  onClick?: () => void;
  clickable?: boolean;
  class?: string;
}

/**
 * Table row with hover effects and optional click handler.
 */
const TableRow: Component<TableRowProps> = (props) => {
  const rowClass = () => {
    const classes = [props.clickable ? styles.rowClickable : styles.row];
    if (props.class) {
      classes.push(props.class);
    }
    return classes.join(' ');
  };

  return (
    <tr class={rowClass()} onClick={props.onClick}>
      {props.children}
    </tr>
  );
};

export default TableRow;
