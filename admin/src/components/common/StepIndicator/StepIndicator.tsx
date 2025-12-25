import { Component, For } from "solid-js";
import styles from "./StepIndicator.module.css";

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  labels?: string[];
}

export const StepIndicator: Component<StepIndicatorProps> = (props) => {
  const steps = () => Array.from({ length: props.totalSteps }, (_, i) => i + 1);

  return (
    <div class={styles.container}>
      <For each={steps()}>
        {(step) => (
          <div
            class={`${styles.step} ${step <= props.currentStep ? styles.stepActive : ""}`}
          />
        )}
      </For>
    </div>
  );
};

export const NumberedStepIndicator: Component<StepIndicatorProps> = (props) => {
  const steps = () => Array.from({ length: props.totalSteps }, (_, i) => i + 1);

  return (
    <div class={styles.numberedContainer}>
      <For each={steps()}>
        {(step, index) => (
          <>
            <div class={styles.numberedStep}>
              <span
                class={`${styles.stepNumber} ${
                  step < props.currentStep
                    ? styles.stepNumberCompleted
                    : step === props.currentStep
                    ? styles.stepNumberActive
                    : ""
                }`}
              >
                {step < props.currentStep ? "✓" : step}
              </span>
              {props.labels && props.labels[index()] && (
                <span
                  class={`${styles.stepLabel} ${
                    step === props.currentStep ? styles.stepLabelActive : ""
                  }`}
                >
                  {props.labels[index()]}
                </span>
              )}
            </div>
            {index() < props.totalSteps - 1 && (
              <div
                class={`${styles.stepConnector} ${
                  step < props.currentStep ? styles.stepConnectorActive : ""
                }`}
              />
            )}
          </>
        )}
      </For>
    </div>
  );
};
