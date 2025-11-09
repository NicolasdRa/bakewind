import { Component, For } from "solid-js";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  label?: string;
  placeholder?: string;
}

const FilterSelect: Component<FilterSelectProps> = (props) => {
  return (
    <div class="flex-1 min-w-48">
      {props.label && (
        <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
          {props.label}
        </label>
      )}
      <div class="relative">
        <select
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          class="w-full px-4 py-2.5 pr-10 border rounded-lg transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer"
          style={{
            "background-color": "var(--bg-primary)",
            "border-color": "var(--border-color)",
            "color": "var(--text-primary)",
            "--tw-ring-color": "var(--primary-color)"
          }}
        >
          <For each={props.options}>
            {(option) => <option value={option.value}>{option.label}</option>}
          </For>
        </select>
        {/* Custom dropdown arrow */}
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            class="h-5 w-5"
            style={{ color: "var(--text-tertiary)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default FilterSelect;
