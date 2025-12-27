import { Component, createSignal, createEffect, For, Show } from "solid-js"
import { useTenantRefetch } from "~/hooks/useTenantRefetch"
import { useAuth } from "~/context/AuthContext"
import * as tenantsApi from '~/api/tenants'
import type { InviteStaffData, UpdateStaffData } from '~/api/tenants'
import type { StaffArea, StaffProfile } from '~/api/staff'
import DashboardPageLayout from "~/layouts/DashboardPageLayout"
import LoadingSpinner from "~/components/LoadingSpinner/LoadingSpinner"
import Button from "~/components/common/Button"
import { Heading, Text } from "~/components/common/Typography"
import styles from './TeamPage.module.css'

const STAFF_AREAS: { value: StaffArea; label: string }[] = [
  { value: 'bakery', label: 'Bakery' },
  { value: 'patisserie', label: 'Patisserie' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'front_house', label: 'Front House' },
  { value: 'catering', label: 'Catering' },
  { value: 'retail', label: 'Retail' },
  { value: 'events', label: 'Events' },
  { value: 'management', label: 'Management' },
]

const TeamPage: Component = () => {
  const auth = useAuth()
  const user = () => auth.user

  // State
  const [staffList, setStaffList] = createSignal<StaffProfile[]>([])
  const [isLoading, setIsLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)

  // Modal states
  const [showInviteModal, setShowInviteModal] = createSignal(false)
  const [showEditModal, setShowEditModal] = createSignal(false)
  const [selectedStaff, setSelectedStaff] = createSignal<StaffProfile | null>(null)
  const [isSubmitting, setIsSubmitting] = createSignal(false)

  // Invite form
  const [inviteForm, setInviteForm] = createSignal<InviteStaffData>({
    email: '',
    firstName: '',
    lastName: '',
    position: '',
    department: '',
    areas: [],
  })

  // Edit form
  const [editForm, setEditForm] = createSignal<UpdateStaffData>({
    position: '',
    department: '',
    areas: [],
  })

  // Load staff list
  const loadStaff = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const staff = await tenantsApi.getTenantStaff()
      setStaffList(staff)
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to load team members')
    } finally {
      setIsLoading(false)
    }
  }

  createEffect(() => {
    if (user()?.role === 'OWNER') {
      loadStaff()
    }
  })

  // Refetch when ADMIN user switches tenant, clear data when tenant is deselected
  useTenantRefetch(loadStaff, () => {
    setStaffList([]);
  })

  const handleInvite = async () => {
    try {
      setIsSubmitting(true)
      setError(null)
      await tenantsApi.inviteStaff(inviteForm())
      setShowInviteModal(false)
      setInviteForm({
        email: '',
        firstName: '',
        lastName: '',
        position: '',
        department: '',
        areas: [],
      })
      setSuccessMessage('Staff member invited successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      await loadStaff()
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to invite staff member')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    const staff = selectedStaff()
    if (!staff) return

    try {
      setIsSubmitting(true)
      setError(null)
      await tenantsApi.updateStaffMember(staff.id, editForm())
      setShowEditModal(false)
      setSelectedStaff(null)
      setSuccessMessage('Staff member updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      await loadStaff()
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to update staff member')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return

    try {
      setError(null)
      await tenantsApi.removeStaffMember(staffId)
      setSuccessMessage('Staff member removed successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      await loadStaff()
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to remove staff member')
    }
  }

  const openEditModal = (staff: StaffProfile) => {
    setSelectedStaff(staff)
    setEditForm({
      position: staff.position || '',
      department: staff.department || '',
      areas: staff.areas || [],
    })
    setShowEditModal(true)
  }

  const toggleArea = (area: StaffArea, isInvite: boolean) => {
    if (isInvite) {
      setInviteForm(prev => {
        const areas = prev.areas || []
        if (areas.includes(area)) {
          return { ...prev, areas: areas.filter(a => a !== area) }
        }
        return { ...prev, areas: [...areas, area] }
      })
    } else {
      setEditForm(prev => {
        const areas = prev.areas || []
        if (areas.includes(area)) {
          return { ...prev, areas: areas.filter(a => a !== area) }
        }
        return { ...prev, areas: [...areas, area] }
      })
    }
  }

  // Only show for OWNER role
  if (user()?.role !== 'OWNER') {
    return (
      <DashboardPageLayout
        title="Team Management"
        subtitle="Manage your bakery staff and team members"
      >
        <div class={styles.accessDenied}>
          <Heading variant="card">Access Denied</Heading>
          <Text color="secondary">Only business owners can manage team members.</Text>
        </div>
      </DashboardPageLayout>
    )
  }

  return (
    <DashboardPageLayout
      title="Team Management"
      subtitle="Manage your bakery staff and team members"
      actions={
        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
          <svg class={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span class="btn-text">Invite Staff</span>
        </Button>
      }
    >
      <Show when={error()}>
        <div class={styles.errorBanner}>{error()}</div>
      </Show>

      <Show when={successMessage()}>
        <div class={styles.successBanner}>{successMessage()}</div>
      </Show>

      <Show when={isLoading()}>
        <div class={styles.loadingContainer}>
          <LoadingSpinner message="Loading team members..." />
        </div>
      </Show>

      <Show when={!isLoading()}>
        <Show when={staffList().length === 0}>
          <div class={styles.emptyState}>
            <svg class={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <Heading variant="card">No team members yet</Heading>
            <Text color="secondary">Invite your first staff member to get started.</Text>
            <Button variant="primary" onClick={() => setShowInviteModal(true)}>
              Invite Staff Member
            </Button>
          </div>
        </Show>

        <Show when={staffList().length > 0}>
          <div class={styles.staffGrid}>
            <For each={staffList()}>
              {(staff) => (
                <div class={styles.staffCard}>
                  <div class={styles.staffHeader}>
                    <div class={styles.avatar}>
                      {staff.firstName?.[0]?.toUpperCase() || ''}{staff.lastName?.[0]?.toUpperCase() || ''}
                    </div>
                    <div class={styles.staffInfo}>
                      <Heading variant="card" class={styles.staffName}>{staff.firstName} {staff.lastName}</Heading>
                      <Text variant="body-sm" color="muted" class={styles.staffEmail}>{staff.email}</Text>
                      <Text variant="body-sm" class={styles.staffPosition}>{staff.position || 'No position set'}</Text>
                    </div>
                  </div>

                  <div class={styles.staffDetails}>
                    <div class={styles.detailRow}>
                      <span class={styles.detailLabel}>Department</span>
                      <span class={styles.detailValue}>{staff.department || 'Not assigned'}</span>
                    </div>
                    <div class={styles.detailRow}>
                      <span class={styles.detailLabel}>Areas</span>
                      <div class={styles.areasContainer}>
                        <Show when={staff.areas && staff.areas.length > 0} fallback={
                          <span class={styles.noAreas}>No areas assigned</span>
                        }>
                          <For each={staff.areas}>
                            {(area) => (
                              <span class={styles.areaBadge}>{area}</span>
                            )}
                          </For>
                        </Show>
                      </div>
                    </div>
                    <Show when={staff.hireDate}>
                      <div class={styles.detailRow}>
                        <span class={styles.detailLabel}>Hire Date</span>
                        <span class={styles.detailValue}>
                          {new Date(staff.hireDate!).toLocaleDateString()}
                        </span>
                      </div>
                    </Show>
                  </div>

                  <div class={styles.staffActions}>
                    <Button variant="secondary" size="sm" onClick={() => openEditModal(staff)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleRemove(staff.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* Invite Modal */}
      <Show when={showInviteModal()}>
        <div class={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
          <div class={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div class={styles.modalHeader}>
              <Heading variant="section">Invite Staff Member</Heading>
              <button class={styles.closeButton} onClick={() => setShowInviteModal(false)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class={styles.modalBody}>
              <div class={styles.formGroup}>
                <label class={styles.label}>Email *</label>
                <input
                  type="email"
                  value={inviteForm().email}
                  onInput={(e) => setInviteForm(prev => ({ ...prev, email: e.currentTarget.value }))}
                  class={styles.input}
                  placeholder="staff@example.com"
                />
              </div>

              <div class={styles.formRow}>
                <div class={styles.formGroup}>
                  <label class={styles.label}>First Name *</label>
                  <input
                    type="text"
                    value={inviteForm().firstName}
                    onInput={(e) => setInviteForm(prev => ({ ...prev, firstName: e.currentTarget.value }))}
                    class={styles.input}
                    placeholder="John"
                  />
                </div>
                <div class={styles.formGroup}>
                  <label class={styles.label}>Last Name *</label>
                  <input
                    type="text"
                    value={inviteForm().lastName}
                    onInput={(e) => setInviteForm(prev => ({ ...prev, lastName: e.currentTarget.value }))}
                    class={styles.input}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div class={styles.formRow}>
                <div class={styles.formGroup}>
                  <label class={styles.label}>Position</label>
                  <input
                    type="text"
                    value={inviteForm().position || ''}
                    onInput={(e) => setInviteForm(prev => ({ ...prev, position: e.currentTarget.value }))}
                    class={styles.input}
                    placeholder="Baker"
                  />
                </div>
                <div class={styles.formGroup}>
                  <label class={styles.label}>Department</label>
                  <input
                    type="text"
                    value={inviteForm().department || ''}
                    onInput={(e) => setInviteForm(prev => ({ ...prev, department: e.currentTarget.value }))}
                    class={styles.input}
                    placeholder="Production"
                  />
                </div>
              </div>

              <div class={styles.formGroup}>
                <label class={styles.label}>Work Areas</label>
                <div class={styles.areasGrid}>
                  <For each={STAFF_AREAS}>
                    {(area) => (
                      <label class={styles.areaCheckbox}>
                        <input
                          type="checkbox"
                          checked={inviteForm().areas?.includes(area.value)}
                          onChange={() => toggleArea(area.value, true)}
                        />
                        <span>{area.label}</span>
                      </label>
                    )}
                  </For>
                </div>
              </div>
            </div>

            <div class={styles.modalFooter}>
              <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleInvite}
                disabled={isSubmitting() || !inviteForm().email || !inviteForm().firstName || !inviteForm().lastName}
              >
                {isSubmitting() ? 'Inviting...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </div>
      </Show>

      {/* Edit Modal */}
      <Show when={showEditModal() && selectedStaff()}>
        <div class={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div class={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div class={styles.modalHeader}>
              <Heading variant="section">Edit Staff Member</Heading>
              <button class={styles.closeButton} onClick={() => setShowEditModal(false)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class={styles.modalBody}>
              <div class={styles.formRow}>
                <div class={styles.formGroup}>
                  <label class={styles.label}>Position</label>
                  <input
                    type="text"
                    value={editForm().position || ''}
                    onInput={(e) => setEditForm(prev => ({ ...prev, position: e.currentTarget.value }))}
                    class={styles.input}
                    placeholder="Baker"
                  />
                </div>
                <div class={styles.formGroup}>
                  <label class={styles.label}>Department</label>
                  <input
                    type="text"
                    value={editForm().department || ''}
                    onInput={(e) => setEditForm(prev => ({ ...prev, department: e.currentTarget.value }))}
                    class={styles.input}
                    placeholder="Production"
                  />
                </div>
              </div>

              <div class={styles.formGroup}>
                <label class={styles.label}>Work Areas</label>
                <div class={styles.areasGrid}>
                  <For each={STAFF_AREAS}>
                    {(area) => (
                      <label class={styles.areaCheckbox}>
                        <input
                          type="checkbox"
                          checked={editForm().areas?.includes(area.value)}
                          onChange={() => toggleArea(area.value, false)}
                        />
                        <span>{area.label}</span>
                      </label>
                    )}
                  </For>
                </div>
              </div>
            </div>

            <div class={styles.modalFooter}>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleEdit} disabled={isSubmitting()}>
                {isSubmitting() ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </DashboardPageLayout>
  )
}

export default TeamPage
