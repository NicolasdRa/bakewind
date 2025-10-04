import { Component, JSX } from 'solid-js';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: JSX.Element;
}

const AuthLayout: Component<AuthLayoutProps> = (props) => {
  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          {/* Logo */}
          <div class="flex justify-center mb-4">
            <div class="text-4xl font-bold text-blue-600">🥖 BakeWind</div>
          </div>

          {/* Title */}
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            {props.title}
          </h1>

          {/* Subtitle */}
          {props.subtitle && (
            <p class="text-gray-600">{props.subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div class="bg-white rounded-lg shadow-md p-8">
          {props.children}
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
