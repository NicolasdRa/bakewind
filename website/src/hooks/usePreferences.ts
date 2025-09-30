import { createSignal } from "solid-js";

export const usePreferences = () => {
  const [isUpdating, setIsUpdating] = createSignal(false);
  const [updateError, setUpdateError] = createSignal<string | null>(null);

  const updatePreferences = async (preferences: {
    theme?: string;
    displayDensity?: string;
    dashboardLayout?: string;
    sidebarCollapsed?: boolean;
    enableAnimations?: boolean;
    enableSounds?: boolean;
    autoSave?: boolean;
  }) => {
    setIsUpdating(true);
    setUpdateError(null);

    try {
      // Store UI preferences in localStorage
      if (typeof window !== 'undefined') {
        const currentPreferences = JSON.parse(localStorage.getItem('uiPreferences') || '{}');
        const updatedPreferences = { ...currentPreferences, ...preferences };
        localStorage.setItem('uiPreferences', JSON.stringify(updatedPreferences));
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return preferences;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update preferences';
      setUpdateError(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const getPreferences = () => {
    if (typeof window === 'undefined') return {};
    return JSON.parse(localStorage.getItem('uiPreferences') || '{}');
  };

  const clearError = () => setUpdateError(null);

  return {
    updatePreferences,
    getPreferences,
    isUpdating: isUpdating(),
    updateError: updateError(),
    clearError
  };
};