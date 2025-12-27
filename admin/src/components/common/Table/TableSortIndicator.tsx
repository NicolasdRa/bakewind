import { Component } from "solid-js";
import type { SortDirection } from "./types";
import styles from "./Table.module.css";

interface TableSortIndicatorProps {
  direction: SortDirection;
}

/**
 * Sort direction indicator arrows for sortable table headers.
 */
const TableSortIndicator: Component<TableSortIndicatorProps> = (props) => {
  return (
    <span class={styles.sortIndicator}>
      <span
        class={styles.sortArrow}
        classList={{
          [styles.sortArrowActive]: props.direction === 'asc',
          [styles.sortArrowInactive]: props.direction !== 'asc'
        }}
      >
        ▲
      </span>
      <span
        class={styles.sortArrow}
        classList={{
          [styles.sortArrowActive]: props.direction === 'desc',
          [styles.sortArrowInactive]: props.direction !== 'desc'
        }}
      >
        ▼
      </span>
    </span>
  );
};

export default TableSortIndicator;
