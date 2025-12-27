import { Component, JSX, Show } from "solid-js";
import type { Alignment, SortDirection } from "./types";
import TableSortIndicator from "./TableSortIndicator";
import styles from "./Table.module.css";

interface TableHeaderCellProps {
  children: JSX.Element;
  align?: Alignment;
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
  minWidth?: string;
  class?: string;
}

/**
 * Table header cell with alignment and sorting support.
 */
const TableHeaderCell: Component<TableHeaderCellProps> = (props) => {
  const align = () => props.align || 'left';

  const cellClass = () => {
    const classes: string[] = [];

    // Base alignment class
    switch (align()) {
      case 'center':
        classes.push(styles.headerCellCenter);
        break;
      case 'right':
        classes.push(styles.headerCellRight);
        break;
      default:
        classes.push(styles.headerCell);
    }

    // Sortable class
    if (props.sortable) {
      classes.push(styles.headerCellSortable);
    }

    // Custom class
    if (props.class) {
      classes.push(props.class);
    }

    return classes.join(' ');
  };

  const contentClass = () => {
    switch (align()) {
      case 'center':
        return styles.headerContentCenter;
      case 'right':
        return styles.headerContentRight;
      default:
        return styles.headerContent;
    }
  };

  const handleClick = () => {
    if (props.sortable && props.onSort) {
      props.onSort();
    }
  };

  const minWidthStyle = () => {
    return props.minWidth ? { 'min-width': props.minWidth } : undefined;
  };

  return (
    <th class={cellClass()} onClick={handleClick}>
      <div class={contentClass()} style={minWidthStyle()}>
        <span>{props.children}</span>
        <Show when={props.sortable}>
          <TableSortIndicator direction={props.sortDirection ?? null} />
        </Show>
      </div>
    </th>
  );
};

export default TableHeaderCell;
