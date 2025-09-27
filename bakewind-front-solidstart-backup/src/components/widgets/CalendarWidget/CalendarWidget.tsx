import { createSignal, Index } from 'solid-js'
import BaseWidget from '../../BaseWidget/BaseWidget'
import styles from './CalendarWidget.module.css'

interface CalendarWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function CalendarWidget(props: CalendarWidgetProps) {
  const [currentDate] = createSignal(new Date())
  
  const events = [
    { date: new Date().getDate(), title: 'Team Meeting', time: '10:00 AM' },
    { date: new Date().getDate() + 1, title: 'Client Call', time: '2:00 PM' },
    { date: new Date().getDate() + 2, title: 'Project Review', time: '11:00 AM' }
  ]

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && 
           currentDate().getMonth() === today.getMonth() && 
           currentDate().getFullYear() === today.getFullYear()
  }

  const hasEvent = (day: number) => {
    return events.some(event => event.date === day)
  }

  return (
    <BaseWidget {...props}>
      <div class={styles.container}>
        {/* Calendar Header */}
        <div class={styles.header}>
          <h4 class={styles.monthTitle}>
            {currentDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
        </div>

        {/* Mini Calendar */}
        <div class={styles.calendarGrid}>
          <Index each={['S', 'M', 'T', 'W', 'T', 'F', 'S']}>
            {(day) => (
              <div class={styles.dayHeader}>{day()}</div>
            )}
          </Index>
          
          {/* Empty cells for days before month starts */}
          <Index each={Array.from({ length: getFirstDayOfMonth(currentDate()) })}>
            {() => <div class={styles.emptyCell}></div>}
          </Index>
          
          {/* Days of the month */}
          <Index each={Array.from({ length: getDaysInMonth(currentDate()) })}>
            {(_, index) => {
              const day = index + 1
              return (
                <div 
                  class={
                    isToday(day) 
                      ? styles.dayToday
                      : hasEvent(day)
                      ? styles.dayWithEvent
                      : styles.dayCell
                  }
                >
                  {day}
                </div>
              )
            }}
          </Index>
        </div>

        {/* Upcoming Events */}
        <div class={styles.eventsSection}>
          <h5 class={styles.eventsTitle}>Upcoming</h5>
          <div class={styles.eventsList}>
            <Index each={events.slice(0, 2)}>
              {(event) => (
                <div class={styles.eventItem}>
                  <div class={styles.eventIndicator}></div>
                  <div class={styles.eventContent}>
                    <div class={styles.eventTitle}>{event().title}</div>
                    <div class={styles.eventTime}>{event().time}</div>
                  </div>
                </div>
              )}
            </Index>
          </div>
        </div>
      </div>
    </BaseWidget>
  )
}