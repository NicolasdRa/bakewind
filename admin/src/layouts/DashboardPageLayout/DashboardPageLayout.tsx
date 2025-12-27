import { Component, JSXElement, Show } from 'solid-js'
import { Heading, Text } from '~/components/common/Typography'
import styles from './DashboardPageLayout.module.css'

interface DashboardPageLayoutProps {
  title: string
  subtitle?: string | JSXElement
  actions?: JSXElement
  children: JSXElement
}

const DashboardPageLayout: Component<DashboardPageLayoutProps> = (props) => {
  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <div class={styles.headerContent}>
          <Heading level="h1" variant="page">{props.title}</Heading>
          <Show when={props.subtitle}>
            {typeof props.subtitle === 'string'
              ? <Text color="secondary">{props.subtitle}</Text>
              : props.subtitle
            }
          </Show>
        </div>
        <Show when={props.actions}>
          <div class={styles.headerActions}>
            {props.actions}
          </div>
        </Show>
      </div>
      {props.children}
    </div>
  )
}

export default DashboardPageLayout
