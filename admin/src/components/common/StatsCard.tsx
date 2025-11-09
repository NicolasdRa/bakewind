import { Component, JSX } from "solid-js";

interface StatsCardProps {
  title: string;
  value: string | number;
  valueColor?: string;
  icon?: JSX.Element;
}

const StatsCard: Component<StatsCardProps> = (props) => {
  return (
    <div
      class="rounded-xl p-6 border transition-all hover:shadow-md"
      style={{
        "background-color": "var(--bg-primary)",
        "border-color": "var(--border-color)",
        "box-shadow": "var(--shadow-card)"
      }}
    >
      <h3 class="text-lg font-semibold mb-2" style="color: var(--text-secondary)">
        {props.title}
      </h3>
      <div class="flex items-center gap-3">
        {props.icon && <div>{props.icon}</div>}
        <p
          class="text-4xl font-bold"
          style={{ color: props.valueColor || "var(--primary-color)" }}
        >
          {props.value}
        </p>
      </div>
    </div>
  );
};

export default StatsCard;
