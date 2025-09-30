import { action } from "@solidjs/router";
import { updateUserLocation } from "~/lib/auth-session";

export const setLocationAction = action(async (locationId: string) => {
  "use server";
  await updateUserLocation(locationId);
  console.log('📍 [AUTH_ACTIONS] Location ID updated in session:', locationId);
});