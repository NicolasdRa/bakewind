import { createSignal } from "solid-js";
import { updateUserProfile } from "../api/userApi";
import { useCurrentUser } from "./useCurrentUser";
import type { DashboardUserData } from "../types/auth";

export const useProfileMutations = () => {
  const { mutate: mutateUser, refetch } = useCurrentUser();
  const [isUpdating, setIsUpdating] = createSignal(false);
  const [updateError, setUpdateError] = createSignal<string | null>(null);

  const updateProfile = async (data: Partial<DashboardUserData>) => {
    setIsUpdating(true);
    setUpdateError(null);

    try {
      // Optimistic update - immediately update the UI
      mutateUser((current) => {
        if (!current) return current;
        return { ...current, ...data };
      });

      // Make the actual API call
      const updatedUser = await updateUserProfile(data);

      // Confirm with server response
      mutateUser(updatedUser);

      return updatedUser;
    } catch (error) {
      // Revert optimistic update on error
      await refetch();

      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setUpdateError(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const clearError = () => setUpdateError(null);

  return {
    updateProfile,
    isUpdating: isUpdating(),
    updateError: updateError(),
    clearError
  };
};