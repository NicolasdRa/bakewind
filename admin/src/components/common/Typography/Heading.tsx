import { JSX, Switch, Match } from 'solid-js'
import styles from './Heading.module.css'

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
type HeadingVariant = 'page' | 'section' | 'card' | 'label'

interface HeadingProps {
  level?: HeadingLevel
  variant?: HeadingVariant
  class?: string
  classList?: Record<string, boolean | undefined>
  children: JSX.Element | string
}

export default function Heading(props: HeadingProps) {
  const level = () => props.level || 'h2'
  const variant = () => props.variant || 'section'

  const className = () => {
    const classes = [styles.heading, styles[`heading-${variant()}`]]
    if (props.class) classes.push(props.class)
    if (props.classList) {
      Object.entries(props.classList).forEach(([cls, active]) => {
        if (active) classes.push(cls)
      })
    }
    return classes.join(' ')
  }

  return (
    <Switch>
      <Match when={level() === 'h1'}><h1 class={className()}>{props.children}</h1></Match>
      <Match when={level() === 'h2'}><h2 class={className()}>{props.children}</h2></Match>
      <Match when={level() === 'h3'}><h3 class={className()}>{props.children}</h3></Match>
      <Match when={level() === 'h4'}><h4 class={className()}>{props.children}</h4></Match>
      <Match when={level() === 'h5'}><h5 class={className()}>{props.children}</h5></Match>
      <Match when={level() === 'h6'}><h6 class={className()}>{props.children}</h6></Match>
    </Switch>
  )
}
