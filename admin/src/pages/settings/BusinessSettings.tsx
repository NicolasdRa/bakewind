import { Component, createSignal, createEffect, Show } from "solid-js"
import { useAuth } from "~/context/AuthContext"
import * as tenantsApi from '~/api/tenants'
import type { Tenant, UpdateTenantData } from '~/api/tenants'
import LoadingSpinner from "~/components/LoadingSpinner/LoadingSpinner"
import Button from "~/components/common/Button"
import { Heading, Text } from "~/components/common/Typography"
import styles from './SettingsPage.module.css'

const BusinessSettings: Component = () => {
  const auth = useAuth()
  const user = () => auth.user

  // State
  const [tenant, setTenant] = createSignal<Tenant | null>(null)
  const [isLoading, setIsLoading] = createSignal(true)
  const [isSaving, setIsSaving] = createSignal(false)
  const [isEditMode, setIsEditMode] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)

  // Form state
  const [formData, setFormData] = createSignal<UpdateTenantData>({
    businessName: '',
    businessPhone: '',
    businessAddress: '',
  })

  // Load tenant data
  createEffect(async () => {
    if (user()) {
      try {
        setIsLoading(true)
        const tenantData = await tenantsApi.getMyTenant()
        setTenant(tenantData)
        setFormData({
          businessName: tenantData.businessName || '',
          businessPhone: tenantData.businessPhone || '',
          businessAddress: tenantData.businessAddress || '',
        })
      } catch (err: any) {
        setError(err?.data?.message || 'Failed to load business settings')
      } finally {
        setIsLoading(false)
      }
    }
  })

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      const updated = await tenantsApi.updateMyTenant(formData())
      setTenant(updated)
      setIsEditMode(false)
      setSuccessMessage('Business settings updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to update business settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    const t = tenant()
    if (t) {
      setFormData({
        businessName: t.businessName || '',
        businessPhone: t.businessPhone || '',
        businessAddress: t.businessAddress || '',
      })
    }
    setIsEditMode(false)
    setError(null)
  }

  const updateField = (field: keyof UpdateTenantData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const trialDaysRemaining = () => {
    const t = tenant()
    if (!t) return null
    return tenantsApi.getTrialDaysRemaining(t)
  }

  const isTrialExpired = () => {
    const t = tenant()
    if (!t) return false
    return tenantsApi.isTrialExpired(t)
  }

  // Only show for OWNER role
  if (user()?.role !== 'OWNER') {
    return (
      <div class={styles.container}>
        <div class={styles.settingsCard}>
          <Heading variant="card" class={styles.cardTitle}>Access Denied</Heading>
          <Text color="secondary">
            Only business owners can access business settings.
          </Text>
        </div>
      </div>
    )
  }

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <div class={styles.headerContent}>
          <Heading level="h1" variant="page">Business Settings</Heading>
          <Text color="secondary">Manage your bakery business information and subscription</Text>
        </div>
      </div>

      <Show when={isLoading()}>
        <div style={{ padding: '2rem', "text-align": 'center' }}>
          <LoadingSpinner message="Loading business settings..." />
        </div>
      </Show>

      <Show when={!isLoading() && tenant()}>
        <Show when={error()}>
          <div style={{
            padding: '1rem',
            "margin-bottom": '1rem',
            background: 'var(--error-bg)',
            color: 'var(--error-color)',
            "border-radius": 'var(--radius-md)'
          }}>
            {error()}
          </div>
        </Show>

        <Show when={successMessage()}>
          <div style={{
            padding: '1rem',
            "margin-bottom": '1rem',
            background: 'var(--success-bg)',
            color: 'var(--success-color)',
            "border-radius": 'var(--radius-md)'
          }}>
            {successMessage()}
          </div>
        </Show>

        <div class={styles.settingsGrid}>
          {/* Subscription Status Card */}
          <div class={styles.settingsCard}>
            <Heading variant="card" class={styles.cardTitle}>Subscription Status</Heading>
            <div class={styles.formGroup}>
              <div style={{ display: 'flex', "align-items": 'center', gap: '0.5rem', "margin-bottom": '1rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  "border-radius": 'var(--radius-full)',
                  "font-size": 'var(--font-size-sm)',
                  "font-weight": 'var(--font-weight-semibold)',
                  background: tenant()?.subscriptionStatus === 'active' ? 'var(--success-bg)' :
                              tenant()?.subscriptionStatus === 'trial' ? 'var(--warning-bg)' : 'var(--error-bg)',
                  color: tenant()?.subscriptionStatus === 'active' ? 'var(--success-color)' :
                         tenant()?.subscriptionStatus === 'trial' ? 'var(--warning-color)' : 'var(--error-color)',
                }}>
                  {tenantsApi.getSubscriptionStatusLabel(tenant()!.subscriptionStatus)}
                </span>
              </div>

              <Show when={tenant()?.subscriptionStatus === 'trial'}>
                <div style={{
                  padding: '1rem',
                  background: isTrialExpired() ? 'var(--error-bg)' : 'var(--warning-bg)',
                  "border-radius": 'var(--radius-md)',
                  color: isTrialExpired() ? 'var(--error-color)' : 'var(--warning-color)'
                }}>
                  <Show when={!isTrialExpired()}>
                    <p style={{ margin: 0, "font-weight": 'var(--font-weight-semibold)' }}>
                      Trial ends in {trialDaysRemaining()} days
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', "font-size": 'var(--font-size-sm)' }}>
                      Upgrade to a paid plan to continue using all features.
                    </p>
                  </Show>
                  <Show when={isTrialExpired()}>
                    <p style={{ margin: 0, "font-weight": 'var(--font-weight-semibold)' }}>
                      Your trial has expired
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', "font-size": 'var(--font-size-sm)' }}>
                      Please upgrade to continue using the platform.
                    </p>
                  </Show>
                </div>
              </Show>

              <div style={{ "margin-top": '1rem' }}>
                <Button variant="primary" size="sm" disabled>
                  Manage Subscription (Coming Soon)
                </Button>
              </div>
            </div>
          </div>

          {/* Business Information Card */}
          <div class={styles.settingsCard}>
            <div style={{ display: 'flex', "justify-content": 'space-between', "align-items": 'center', "margin-bottom": '1rem' }}>
              <Heading variant="card" class={styles.cardTitle} style={{ margin: 0 }}>Business Information</Heading>
              <Show when={!isEditMode()}>
                <Button variant="secondary" size="sm" onClick={() => setIsEditMode(true)}>
                  Edit
                </Button>
              </Show>
            </div>

            <div class={styles.formGroup}>
              <div>
                <label class={styles.label}>Business Name</label>
                <Show when={isEditMode()} fallback={
                  <div style={{
                    padding: 'var(--input-padding)',
                    background: 'var(--bg-secondary)',
                    "border-radius": 'var(--radius-md)',
                    color: 'var(--text-primary)'
                  }}>
                    {tenant()?.businessName || 'Not set'}
                  </div>
                }>
                  <input
                    type="text"
                    value={formData().businessName}
                    onInput={(e) => updateField('businessName', e.currentTarget.value)}
                    class={styles.input}
                    placeholder="Enter business name"
                  />
                </Show>
              </div>

              <div>
                <label class={styles.label}>Business Phone</label>
                <Show when={isEditMode()} fallback={
                  <div style={{
                    padding: 'var(--input-padding)',
                    background: 'var(--bg-secondary)',
                    "border-radius": 'var(--radius-md)',
                    color: 'var(--text-primary)'
                  }}>
                    {tenant()?.businessPhone || 'Not set'}
                  </div>
                }>
                  <input
                    type="tel"
                    value={formData().businessPhone || ''}
                    onInput={(e) => updateField('businessPhone', e.currentTarget.value)}
                    class={styles.input}
                    placeholder="Enter business phone"
                  />
                </Show>
              </div>

              <div>
                <label class={styles.label}>Business Address</label>
                <Show when={isEditMode()} fallback={
                  <div style={{
                    padding: 'var(--input-padding)',
                    background: 'var(--bg-secondary)',
                    "border-radius": 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    "min-height": '60px'
                  }}>
                    {tenant()?.businessAddress || 'Not set'}
                  </div>
                }>
                  <textarea
                    value={formData().businessAddress || ''}
                    onInput={(e) => updateField('businessAddress', e.currentTarget.value)}
                    class={styles.input}
                    style={{ "min-height": '80px', resize: 'vertical' }}
                    placeholder="Enter business address"
                  />
                </Show>
              </div>

              <Show when={isEditMode()}>
                <div style={{ display: 'flex', gap: '0.5rem', "margin-top": '1rem' }}>
                  <Button variant="secondary" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving()}>
                    {isSaving() ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Show>
            </div>
          </div>

          {/* Account Details Card */}
          <div class={styles.settingsCard}>
            <Heading variant="card" class={styles.cardTitle}>Account Details</Heading>
            <div class={styles.formGroup}>
              <div>
                <label class={styles.label}>Tenant ID</label>
                <div style={{
                  padding: 'var(--input-padding)',
                  background: 'var(--bg-secondary)',
                  "border-radius": 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  "font-family": 'monospace',
                  "font-size": 'var(--font-size-sm)'
                }}>
                  {tenant()?.id}
                </div>
              </div>

              <div>
                <label class={styles.label}>Account Created</label>
                <div style={{
                  padding: 'var(--input-padding)',
                  background: 'var(--bg-secondary)',
                  "border-radius": 'var(--radius-md)',
                  color: 'var(--text-primary)'
                }}>
                  {tenant()?.createdAt ? new Date(tenant()!.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown'}
                </div>
              </div>

              <div>
                <label class={styles.label}>Onboarding Status</label>
                <div style={{
                  padding: 'var(--input-padding)',
                  background: 'var(--bg-secondary)',
                  "border-radius": 'var(--radius-md)',
                  color: 'var(--text-primary)'
                }}>
                  {tenant()?.onboardingCompleted ? 'Completed' : 'In Progress'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default BusinessSettings
