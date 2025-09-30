
import { isServer } from 'solid-js/web'
import { appActions } from '~/stores/appStore'

/**
 * StoreInitializer - Handles client-side store initialization
 * This component should be placed at the root of the app to ensure
 * proper hydration and state persistence
 */
export default function StoreInitializer() {
  // Initialize client state immediately on the client
  if (!isServer) {
    appActions.initializeClientState()
  }

  // This component doesn't render anything
  return null
}