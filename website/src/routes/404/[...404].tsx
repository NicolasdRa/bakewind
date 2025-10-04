import { A } from "@solidjs/router";
import SEO from '~/components/SEO/SEO';
import Logo from '~/components/Logo/Logo';
import styles from './[...404].module.css';

export default function NotFound() {
  return (
    <>
      <SEO
        title="Page Not Found - BakeWind"
        description="The page you are looking for could not be found. Return to the homepage or explore BakeWind."
        path="/404"
      />

      <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div class="text-center max-w-md">
          <div class="mb-8">
            <Logo size="large" />
          </div>

          <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 class="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p class="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <A
              href="/"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </A>
            <A
              href="/pricing"
              class="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              View Pricing
            </A>
          </div>
        </div>
      </div>
    </>
  );
}
