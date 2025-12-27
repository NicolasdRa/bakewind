import { Component, JSX } from "solid-js";
import type { Alignment } from "./types";
import styles from "./Table.module.css";

interface TableCellProps {
  children: JSX.Element;
  align?: Alignment;
  nowrap?: boolean;
  class?: string;
}

/**
 * Table cell with alignment variants.
 */
const TableCell: Component<TableCellProps> = (props) => {
  const cellClass = () => {
    const classes: string[] = [];

    // Alignment class
    switch (props.align) {
      case 'center':
        classes.push(styles.cellCenter);
        break;
      case 'right':
        classes.push(styles.cellRight);
        break;
      default:
        classes.push(styles.cell);
    }

    // Nowrap class
    if (props.nowrap) {
      classes.push(styles.cellNowrap);
    }

    // Custom class
    if (props.class) {
      classes.push(props.class);
    }

    return classes.join(' ');
  };

  return (
    <td class={cellClass()}>
      {props.children}
    </td>
  );
};

export default TableCell;
