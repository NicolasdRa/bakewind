import { Component, JSX } from "solid-js";

interface TableBodyProps {
  children: JSX.Element;
  class?: string;
}

/**
 * Simple table body wrapper.
 */
const TableBody: Component<TableBodyProps> = (props) => {
  return (
    <tbody class={props.class}>
      {props.children}
    </tbody>
  );
};

export default TableBody;
