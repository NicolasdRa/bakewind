import { createSignal } from "solid-js";

export const useAccountMutations = () => {
  const [isUpdating, setIsUpdating] = createSignal(false);
  const [updateError, setUpdateError] = createSignal<string | null>(null);

  const updateAccountSettings = async (settings: {
    language?: string;
    timezone?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    marketingEmails?: boolean;
  }) => {
    setIsUpdating(true);
    setUpdateError(null);

    try {
      // TODO: Implement account settings API endpoint
      // For now, store settings in localStorage
      if (typeof window !== 'undefined') {
        const currentSettings = JSON.parse(localStorage.getItem('accountSettings') || '{}');
        const updatedSettings = { ...currentSettings, ...settings };
        localStorage.setItem('accountSettings', JSON.stringify(updatedSettings));
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return settings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update account settings';
      setUpdateError(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const clearError = () => setUpdateError(null);

  return {
    updateAccountSettings,
    isUpdating: isUpdating(),
    updateError: updateError(),
    clearError
  };
};