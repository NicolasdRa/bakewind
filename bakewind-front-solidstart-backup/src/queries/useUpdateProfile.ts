import { useSubmission } from "@solidjs/router";
import { updateProfile } from "~/routes/api/profile/update";

export type { UpdateProfileData } from "~/routes/api/profile/update";

export function useUpdateProfile() {
  const submission = useSubmission(updateProfile);

  return {
    updateProfile: submission.mutate,
    isLoading: () => submission.pending,
    error: () => submission.error?.message || null,
    result: () => submission.result,
  };
}