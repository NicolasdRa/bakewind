import { Component, JSX, Show } from "solid-js";

interface InfoModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'info' | 'error' | 'warning' | 'success';
}

const InfoModal: Component<InfoModalProps> = (props) => {
  const getIconColor = () => {
    switch (props.type) {
      case 'error':
        return 'var(--error-color)';
      case 'warning':
        return 'var(--warning-color)';
      case 'success':
        return 'var(--success-color)';
      default:
        return 'var(--info-color)';
    }
  };

  const getIcon = () => {
    switch (props.type) {
      case 'error':
        return (
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'success':
        return (
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ "background-color": "var(--overlay-bg)" }}
        onClick={props.onClose}
      >
        <div
          class="rounded-lg shadow-xl max-w-md w-full p-6"
          style={{
            "background-color": "var(--bg-primary)",
            "border": "1px solid var(--border-color)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="flex items-start mb-4">
            <div class="flex-shrink-0 mr-3" style={{ "color": getIconColor() }}>
              {getIcon()}
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary)">
                {props.title}
              </h3>
              <p class="text-sm" style="color: var(--text-secondary)">
                {props.message}
              </p>
            </div>
          </div>
          <div class="flex justify-end">
            <button
              onClick={props.onClose}
              class="px-4 py-2 rounded-md font-medium transition-colors"
              style={{
                "background-color": "var(--primary-color)",
                "color": "white"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--primary-color)"}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default InfoModal;
