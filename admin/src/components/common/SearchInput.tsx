import { Component } from "solid-js";

interface SearchInputProps {
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const SearchInput: Component<SearchInputProps> = (props) => {
  return (
    <div class="flex-1 min-w-64">
      {props.label && (
        <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
          {props.label}
        </label>
      )}
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          placeholder={props.placeholder || "Search..."}
          class="w-full pl-10 pr-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
          style={{
            "background-color": "var(--bg-primary)",
            "border-color": "var(--border-color)",
            "color": "var(--text-primary)",
            "--tw-ring-color": "var(--primary-color)"
          }}
        />
      </div>
    </div>
  );
};

export default SearchInput;
