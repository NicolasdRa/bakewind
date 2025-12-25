import { Component, createSignal, Show, onMount, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import styles from "./DatePicker.module.css";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
}

const DatePicker: Component<DatePickerProps> = (props) => {
  const [showCalendar, setShowCalendar] = createSignal(false);
  const [selectedDate, setSelectedDate] = createSignal<Date | null>(
    props.value ? new Date(props.value) : null
  );
  const [currentMonth, setCurrentMonth] = createSignal(
    props.value ? new Date(props.value) : new Date()
  );
  const [dropdownPosition, setDropdownPosition] = createSignal({ top: 0, left: 0 });
  let containerRef: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;
  let calendarRef: HTMLDivElement | undefined;

  // Handle clicks outside to close calendar
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as Node;
    const isOutsideContainer = containerRef && !containerRef.contains(target);
    const isOutsideCalendar = calendarRef && !calendarRef.contains(target);

    if (isOutsideContainer && isOutsideCalendar) {
      setShowCalendar(false);
    }
  };

  // Calculate and set dropdown position, then open calendar
  const openCalendar = () => {
    if (props.disabled) return;

    if (inputRef) {
      const rect = inputRef.getBoundingClientRect();
      const calendarWidth = 320; // 20rem
      const calendarHeight = 380; // Approximate height of calendar
      const gap = 8; // 0.5rem gap
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate horizontal position - ensure calendar stays within viewport
      let left = rect.left;
      if (left + calendarWidth > viewportWidth) {
        left = Math.max(8, viewportWidth - calendarWidth - 8);
      }

      // Calculate vertical position - flip above if not enough space below
      let top = rect.bottom + gap;
      if (top + calendarHeight > viewportHeight) {
        // Not enough space below, try above
        const topAbove = rect.top - gap - calendarHeight;
        if (topAbove > 0) {
          top = topAbove;
        } else {
          // Neither works well, position at top of viewport with some padding
          top = Math.max(8, viewportHeight - calendarHeight - 8);
        }
      }

      setDropdownPosition({ top, left });
    }
    setShowCalendar(!showCalendar());
  };

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatISODate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      currentMonth().getFullYear(),
      currentMonth().getMonth(),
      day
    );
    setSelectedDate(newDate);
    props.onChange(formatISODate(newDate));
    setShowCalendar(false);
  };

  const handlePreviousMonth = (e: Event) => {
    e.stopPropagation();
    const newMonth = new Date(currentMonth());
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = (e: Event) => {
    e.stopPropagation();
    const newMonth = new Date(currentMonth());
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const handleToday = (e: Event) => {
    e.stopPropagation();
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
    props.onChange(formatISODate(today));
    setShowCalendar(false);
  };

  const handleClear = (e: Event) => {
    e.stopPropagation();
    setSelectedDate(null);
    props.onChange("");
    setShowCalendar(false);
  };

  const isDateDisabled = (day: number): boolean => {
    const date = new Date(
      currentMonth().getFullYear(),
      currentMonth().getMonth(),
      day
    );
    const isoDate = formatISODate(date);

    if (props.minDate && isoDate < props.minDate) return true;
    if (props.maxDate && isoDate > props.maxDate) return true;
    return false;
  };

  const isSelectedDate = (day: number): boolean => {
    if (!selectedDate()) return false;
    const date = new Date(
      currentMonth().getFullYear(),
      currentMonth().getMonth(),
      day
    );
    return formatISODate(date) === formatISODate(selectedDate()!);
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    const date = new Date(
      currentMonth().getFullYear(),
      currentMonth().getMonth(),
      day
    );
    return formatISODate(date) === formatISODate(today);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth());
    const firstDay = getFirstDayOfMonth(currentMonth());
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getDayButtonClass = (day: number) => {
    const classes = [styles.dayButton];
    if (isSelectedDate(day)) classes.push(styles.dayButtonSelected);
    if (isToday(day)) classes.push(styles.dayButtonToday);
    if (isDateDisabled(day)) classes.push(styles.dayButtonDisabled);
    return classes.join(" ");
  };

  return (
    <div ref={containerRef} class={styles.container}>
      {props.label && (
        <label class={styles.label}>{props.label}</label>
      )}

      <div class={styles.inputWrapper}>
        <div class={styles.icon}>
          <svg class={styles.iconSvg} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          class={styles.input}
          value={formatDisplayDate(selectedDate())}
          placeholder={props.placeholder || "Select date"}
          onClick={openCalendar}
          readOnly
          disabled={props.disabled}
        />

        <Show when={showCalendar()}>
          <Portal mount={document.body}>
            <div
              ref={calendarRef}
              class={styles.calendar}
              style={{
                top: `${dropdownPosition().top}px`,
                left: `${dropdownPosition().left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Calendar Header */}
              <div class={styles.calendarHeader}>
                <button type="button" onClick={handlePreviousMonth} class={styles.navButton}>
                  <svg class={styles.navButtonIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div class={styles.monthYear}>
                  {currentMonth().toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>

                <button type="button" onClick={handleNextMonth} class={styles.navButton}>
                  <svg class={styles.navButtonIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day Labels */}
              <div class={styles.dayLabels}>
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div class={styles.dayLabel}>{day}</div>
                ))}
              </div>

              {/* Calendar Days */}
              <div class={styles.daysGrid}>
                {renderCalendar().map((day) => (
                  <Show
                    when={day !== null}
                    fallback={<div class={styles.emptyDay} />}
                  >
                    <button
                      type="button"
                      disabled={isDateDisabled(day!)}
                      onClick={() => handleDateSelect(day!)}
                      class={getDayButtonClass(day!)}
                    >
                      {day}
                    </button>
                  </Show>
                ))}
              </div>

              {/* Footer Buttons */}
              <div class={styles.footer}>
                <button
                  type="button"
                  onClick={handleToday}
                  class={`${styles.footerButton} ${styles.todayButton}`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  class={`${styles.footerButton} ${styles.clearButton}`}
                >
                  Clear
                </button>
              </div>
            </div>
          </Portal>
        </Show>
      </div>
    </div>
  );
};

export default DatePicker;
