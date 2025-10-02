import { createSignal, onMount } from 'solid-js'
import { authStore } from '~/stores/authStore'

export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
}

/**
 * Hook to get authenticated user information
 * Adapted for SPA - uses authStore state
 */
export function useAuthUser() {
  const [user, setUser] = createSignal<AuthUser | null>(null)

  onMount(() => {
    // Get user from authStore
    if (authStore.user) {
      setUser({
        id: authStore.user.id,
        email: authStore.user.email,
        firstName: authStore.user.firstName,
        lastName: authStore.user.lastName,
        role: authStore.user.role
      })
    }
  })

  return user
}
