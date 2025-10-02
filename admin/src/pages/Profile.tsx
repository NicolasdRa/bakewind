import { Component } from 'solid-js';

const Profile: Component = () => {
  return (
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
        <p class="text-gray-600 dark:text-gray-400">
          Manage your account settings
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
        <div class="text-center">
          <div class="text-6xl mb-4">👤</div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            User Profile
          </h2>
          <p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Profile management will be implemented here. Features will include editing profile information,
            changing password, profile photo upload, and account preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
