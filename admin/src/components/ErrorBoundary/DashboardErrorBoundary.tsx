import { ErrorBoundary } from 'solid-js';
import { JSX } from 'solid-js';

interface DashboardErrorBoundaryProps {
  children: JSX.Element;
  fallbackIcon?: string;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onRetry?: () => void;
}

export default function DashboardErrorBoundary(props: DashboardErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(err, reset) => (
        <div class="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto">
          <div class="text-6xl mb-4">
            {props.fallbackIcon || '⚠️'}
          </div>
          <h2 class="text-2xl font-bold text-red-600 mb-4">
            {props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p class="text-secondary-600 mb-6 text-center">
            {props.fallbackMessage || 'An error occurred while loading this section. Please try again.'}
          </p>
          <div class="flex flex-col gap-3 w-full">
            <button
              onClick={() => {
                if (props.onRetry) {
                  props.onRetry();
                }
                reset();
              }}
              class="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Try Again
            </button>
            <p class="text-sm text-secondary-500 text-center">
              Error: {err.message}
            </p>
          </div>
        </div>
      )}
    >
      {props.children}
    </ErrorBoundary>
  );
}