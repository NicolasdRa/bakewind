import { createSignal, onMount } from 'solid-js'
import { RouteSectionProps } from '@solidjs/router'
import Sidebar from '~/components/Sidebar/Sidebar'
import BottomSheet from '~/components/BottomSheet/BottomSheet'
import { useAppStore } from '~/stores/appStore'
import InfoModal from '~/components/common/InfoModal'
import { useInfoModal } from '~/stores/infoModalStore'
import styles from './DashboardLayout.module.css'

export default function DashboardLayout(props: RouteSectionProps) {
  const { state, actions } = useAppStore()
  const { infoModalState, closeInfoModal } = useInfoModal()
  const [mounted, setMounted] = createSignal(false)

  onMount(() => {
    setMounted(true)
  })

  return (
    <div
      class={styles.container}
      classList={{
        [styles.containerCollapsed]: mounted() && state.sidebarCollapsed,
        [styles.containerExpanded]: !mounted() || !state.sidebarCollapsed
      }}
    >
      {/* Sidebar Component */}
      <Sidebar
        collapsed={mounted() ? state.sidebarCollapsed : false}
        onToggle={actions.setSidebarCollapsed}
        mobileOpen={mounted() ? state.sidebarOpen : false}
        onMobileToggle={actions.setSidebarOpen}
      />

      <div class={styles.contentArea}>
        {/* Scrollable Page Content */}
        <div class={styles.innerContent}>
          {props.children}
        </div>
      </div>

      {/* Global Info Modal */}
      <InfoModal
        isOpen={infoModalState().isOpen}
        title={infoModalState().title}
        message={infoModalState().message}
        type={infoModalState().type}
        onClose={closeInfoModal}
      />

      {/* Bottom Sheet Navigation for Mobile */}
      <BottomSheet />
    </div>
  )
}
