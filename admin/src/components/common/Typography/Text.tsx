import { JSX, Switch, Match } from 'solid-js'
import styles from './Text.module.css'

type TextVariant = 'body' | 'body-sm' | 'caption' | 'label' | 'helper'
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'error' | 'success'

interface TextProps {
  variant?: TextVariant
  color?: TextColor
  as?: 'p' | 'span' | 'label'
  class?: string
  children: JSX.Element | string
}

export default function Text(props: TextProps) {
  const variant = () => props.variant || 'body'
  const color = () => props.color || 'primary'
  const tag = () => props.as || 'p'

  const className = () => {
    const classes = [styles.text, styles[`text-${variant()}`], styles[`color-${color()}`]]
    if (props.class) classes.push(props.class)
    return classes.join(' ')
  }

  return (
    <Switch>
      <Match when={tag() === 'p'}><p class={className()}>{props.children}</p></Match>
      <Match when={tag() === 'span'}><span class={className()}>{props.children}</span></Match>
      <Match when={tag() === 'label'}><label class={className()}>{props.children}</label></Match>
    </Switch>
  )
}
