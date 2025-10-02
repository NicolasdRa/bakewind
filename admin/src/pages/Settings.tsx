import { Component } from 'solid-js';

const Settings: Component = () => {
  return (
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p class="text-gray-600 dark:text-gray-400">
          Configure application preferences
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
        <div class="text-center">
          <div class="text-6xl mb-4">⚙️</div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Application Settings
          </h2>
          <p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Settings panel will be implemented here. Features will include notification preferences,
            location selection, language settings, and system configurations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
