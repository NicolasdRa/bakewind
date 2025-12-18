import { ErrorBoundary } from 'solid-js';
import { JSX } from 'solid-js';
import Button from '../common/Button';

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
            <Button
              onClick={() => {
                if (props.onRetry) {
                  props.onRetry();
                }
                reset();
              }}
              variant="primary"
              fullWidth
            >
              Try Again
            </Button>
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