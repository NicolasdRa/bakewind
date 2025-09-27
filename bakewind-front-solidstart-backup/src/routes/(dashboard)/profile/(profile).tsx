import { onMount } from 'solid-js'
import { redirect } from '@solidjs/router'
import { requireAuth } from '~/lib/auth-guard'
import SEO from '~/components/SEO/SEO'
import DashboardErrorBoundary from '~/components/ErrorBoundary/DashboardErrorBoundary'
import ProfileContent from '~/components/ProfileContent/ProfileContent'

// Route protection
export async function GET() {
  "use server";

  console.log('👤 [PROFILE_ROUTE] Checking authentication...');

  try {
    await requireAuth();
    console.log('✅ [PROFILE_ROUTE] User authenticated, allowing access');
    return new Response(null, { status: 200 });
  } catch (error) {
    if (error instanceof Response) {
      console.log('🔄 [PROFILE_ROUTE] Redirecting unauthenticated user');
      return error;
    }
    console.error('❌ [PROFILE_ROUTE] Error checking auth:', error);
    return redirect('/login');
  }
}

export default function Profile() {
  onMount(() => {
    console.log('Profile page loaded')
  })

  return (
    <>
      <SEO
        title="Profile Settings"
        description="Manage your profile settings, account preferences, and security options in your dashboard."
        path="/profile"
      />

      <DashboardErrorBoundary
        fallbackIcon="👤"
        fallbackTitle="Profile Error"
        fallbackMessage="Unable to load profile information."
      >
        <ProfileContent />
      </DashboardErrorBoundary>
    </>
  )
}