import ViewToggle from '~/components/ViewToggle/ViewToggle'
import ActionButton from '~/components/ActionButton/ActionButton'
import Button from '~/components/common/Button'
import { Text } from '~/components/common/Typography'
import { useAppStore } from '~/stores/appStore'
import { widgetActions } from '~/stores/widgetStore'
import { LAYOUT_OPTIONS, LayoutValue } from '~/constants/dashboard'
import styles from './DashboardActions.module.css'

export default function DashboardActions() {
  const { state, actions } = useAppStore()

  const handleLayoutChange = (layout: string) => {
    actions.setDashboardLayout(layout as LayoutValue)
  }

  const handleResetLayout = () => {
    if (confirm('Reset dashboard to default layout?')) {
      widgetActions.resetLayout()
    }
  }

  const handleClearLayout = () => {
    if (confirm('Clear all widgets? This cannot be undone.')) {
      widgetActions.clearLayout()
    }
  }

  return (
    <>
      <ViewToggle
        options={LAYOUT_OPTIONS}
        currentValue={state.dashboardLayout}
        onChange={handleLayoutChange}
      />

      <div class={styles.actionButtons}>
        <ActionButton
          onClick={() => actions.setShowWidgetModal(true)}
          icon="+"
          hideTextOnMobile={true}
        >
          Add Widget
        </ActionButton>

        <div class={styles.dropdownContainer}>
          <Button variant="ghost" class={styles.dropdownTrigger}>
            <Text as="span" class={styles.dropdownIcon}>⋮</Text>
          </Button>

          <div class={styles.dropdownMenu}>
            <Button
              variant="ghost"
              onClick={handleResetLayout}
              class={`${styles.dropdownItem} ${styles.dropdownItemDefault}`}
            >
              Reset Layout
            </Button>
            <Button
              variant="ghost"
              onClick={handleClearLayout}
              class={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
            >
              Clear All Widgets
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
