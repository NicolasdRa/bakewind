import { Component, createSignal, Show, onMount, onCleanup } from "solid-js";

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
  let containerRef: HTMLDivElement | undefined;

  // Handle clicks outside to close calendar
  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef && !containerRef.contains(e.target as Node)) {
      setShowCalendar(false);
    }
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

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {props.label && (
        <label
          style={{
            display: "block",
            "font-size": "0.875rem",
            "font-weight": "500",
            "margin-bottom": "0.5rem",
            color: "var(--text-secondary)",
          }}
        >
          {props.label}
        </label>
      )}

      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "0.75rem",
            transform: "translateY(-50%)",
            display: "flex",
            "align-items": "center",
            "pointer-events": "none",
            color: "var(--text-tertiary)",
          }}
        >
          <svg
            style={{ width: "1.25rem", height: "1.25rem" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <input
          type="text"
          value={formatDisplayDate(selectedDate())}
          placeholder={props.placeholder || "Select date"}
          onClick={() => !props.disabled && setShowCalendar(!showCalendar())}
          readOnly
          disabled={props.disabled}
          style={{
            width: "100%",
            "padding-left": "2.5rem",
            "padding-right": "1rem",
            "padding-top": "0.625rem",
            "padding-bottom": "0.625rem",
            border: "1px solid var(--border-color)",
            "border-radius": "0.5rem",
            "background-color": props.disabled
              ? "var(--bg-secondary)"
              : "var(--bg-primary)",
            color: "var(--text-primary)",
            cursor: props.disabled ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            outline: "none",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.boxShadow =
              "0 0 0 2px var(--primary-color-alpha)")
          }
          onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
        />

        <Show when={showCalendar()}>
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              left: "0",
              "z-index": "50",
              width: "20rem",
              padding: "1rem",
              "background-color": "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              "border-radius": "0.5rem",
              "box-shadow":
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Calendar Header */}
            <div
              style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "margin-bottom": "1rem",
              }}
            >
              <button
                type="button"
                onClick={handlePreviousMonth}
                style={{
                  padding: "0.25rem",
                  "background-color": "transparent",
                  border: "none",
                  "border-radius": "0.25rem",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--bg-secondary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <svg
                  style={{ width: "1.25rem", height: "1.25rem" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div
                style={{
                  "font-weight": "600",
                  color: "var(--text-primary)",
                }}
              >
                {currentMonth().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  padding: "0.25rem",
                  "background-color": "transparent",
                  border: "none",
                  "border-radius": "0.25rem",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--bg-secondary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <svg
                  style={{ width: "1.25rem", height: "1.25rem" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Day Labels */}
            <div
              style={{
                display: "grid",
                "grid-template-columns": "repeat(7, 1fr)",
                gap: "0.25rem",
                "margin-bottom": "0.5rem",
              }}
            >
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  style={{
                    "text-align": "center",
                    "font-size": "0.75rem",
                    "font-weight": "600",
                    color: "var(--text-secondary)",
                    padding: "0.5rem 0",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div
              style={{
                display: "grid",
                "grid-template-columns": "repeat(7, 1fr)",
                gap: "0.25rem",
              }}
            >
              {renderCalendar().map((day) => (
                <Show
                  when={day !== null}
                  fallback={
                    <div
                      style={{
                        "aspect-ratio": "1",
                      }}
                    />
                  }
                >
                  <button
                    type="button"
                    disabled={isDateDisabled(day!)}
                    onClick={() => handleDateSelect(day!)}
                    style={{
                      "aspect-ratio": "1",
                      display: "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "border-radius": "0.375rem",
                      "font-size": "0.875rem",
                      border: "none",
                      cursor: isDateDisabled(day!) ? "not-allowed" : "pointer",
                      "background-color": isSelectedDate(day!)
                        ? "var(--primary-color)"
                        : "transparent",
                      color: isSelectedDate(day!)
                        ? "white"
                        : isDateDisabled(day!)
                          ? "var(--text-tertiary)"
                          : "var(--text-primary)",
                      "font-weight": isToday(day!) ? "600" : "normal",
                      opacity: isDateDisabled(day!) ? "0.4" : "1",
                      transition: "all 0.2s",
                      outline: isToday(day!) ? "2px solid var(--primary-color)" : "none",
                      "outline-offset": "-2px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isDateDisabled(day!) && !isSelectedDate(day!)) {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-secondary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelectedDate(day!)) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    {day}
                  </button>
                </Show>
              ))}
            </div>

            {/* Footer Buttons */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                "margin-top": "1rem",
                "padding-top": "1rem",
                "border-top": "1px solid var(--border-color)",
              }}
            >
              <button
                type="button"
                onClick={handleToday}
                style={{
                  flex: "1",
                  padding: "0.5rem",
                  "background-color": "var(--bg-secondary)",
                  border: "none",
                  "border-radius": "0.375rem",
                  "font-size": "0.875rem",
                  "font-weight": "500",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--border-color)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--bg-secondary)")
                }
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  flex: "1",
                  padding: "0.5rem",
                  "background-color": "transparent",
                  border: "1px solid var(--border-color)",
                  "border-radius": "0.375rem",
                  "font-size": "0.875rem",
                  "font-weight": "500",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--bg-secondary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Clear
              </button>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default DatePicker;
