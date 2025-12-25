import { Component, JSX } from "solid-js";
import styles from "./FormRow.module.css";

type Columns = 1 | 2 | 3 | 4;
type StackGap = "sm" | "md" | "lg";

interface FormRowProps {
  cols?: Columns;
  children: JSX.Element;
  class?: string;
}

interface FormStackProps {
  gap?: StackGap;
  children: JSX.Element;
  class?: string;
}

const colClasses: Record<Columns, string> = {
  1: styles.cols1,
  2: styles.cols2,
  3: styles.cols3,
  4: styles.cols4,
};

const gapClasses: Record<StackGap, string> = {
  sm: styles.stackSm,
  md: styles.stackMd,
  lg: styles.stackLg,
};

export const FormRow: Component<FormRowProps> = (props) => {
  const rowClasses = () => {
    const classList = [styles.row, colClasses[props.cols || 2]];
    if (props.class) {
      classList.push(props.class);
    }
    return classList.join(" ");
  };

  return <div class={rowClasses()}>{props.children}</div>;
};

export const FormStack: Component<FormStackProps> = (props) => {
  const stackClasses = () => {
    const classList = [styles.stack, gapClasses[props.gap || "md"]];
    if (props.class) {
      classList.push(props.class);
    }
    return classList.join(" ");
  };

  return <div class={stackClasses()}>{props.children}</div>;
};
