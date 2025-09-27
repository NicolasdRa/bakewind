import { RouteSectionProps } from '@solidjs/router'
import { Suspense, Show } from 'solid-js'
import DashboardLayout from '~/layouts/DashboardLayout/DashboardLayout'
import LoadingSpinner from '~/components/LoadingSpinner'
import { ProtectedRoute } from '~/components/ProtectedRoute'
import { useAuthUser } from '~/hooks/useAuthUser'

/**
 * Shared layout for all dashboard routes
 * This layout wraps all routes inside the (dashboard) folder
 * Following SolidStart's file-based routing conventions
 */
export default function DashboardRouteLayout(props: RouteSectionProps) {
  const user = useAuthUser()

  return (
    <ProtectedRoute>
      <Show when={user()} fallback={<LoadingSpinner message="Authenticating..." />}>
        <DashboardLayout>
          <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
            {props.children}
          </Suspense>
        </DashboardLayout>
      </Show>
    </ProtectedRoute>
  )
}