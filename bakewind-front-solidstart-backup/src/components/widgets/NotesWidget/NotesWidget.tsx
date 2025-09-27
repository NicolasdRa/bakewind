import { createSignal, onMount } from 'solid-js'
import BaseWidget from '../../BaseWidget/BaseWidget'
import styles from './NotesWidget.module.css'

interface NotesWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function NotesWidget(props: NotesWidgetProps) {
  const [notes, setNotes] = createSignal('')

  onMount(() => {
    // Load saved notes
    const savedNotes = localStorage.getItem(`notes-${props.widgetId}`) || ''
    setNotes(savedNotes)
  })

  const saveNotes = (value: string) => {
    setNotes(value)
    localStorage.setItem(`notes-${props.widgetId}`, value)
  }

  return (
    <BaseWidget {...props}>
      <div class={styles.container}>
        <textarea
          value={notes()}
          onInput={(e) => saveNotes(e.currentTarget.value)}
          placeholder="Write your notes here..."
          class={styles.textarea}
        />
      </div>
      <div class={styles.helperText}>
        Notes are automatically saved
      </div>
    </BaseWidget>
  )
}