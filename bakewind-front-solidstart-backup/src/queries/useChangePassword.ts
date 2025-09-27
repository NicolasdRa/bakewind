import { useSubmission } from "@solidjs/router";
import { changePassword } from "~/routes/api/auth/change-password";

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function useChangePassword() {
  const submission = useSubmission(changePassword);

  return {
    changePassword: submission.mutate,
    isLoading: () => submission.pending,
    error: () => submission.error?.message || null,
    result: () => submission.result,
  };
}