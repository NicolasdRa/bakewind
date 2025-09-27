import { createSignal, For } from 'solid-js'
import BaseWidget from '../../BaseWidget/BaseWidget'
import styles from './TodoWidget.module.css'


interface TodoItem {
  id: string
  text: string
  completed: boolean
}

interface TodoWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function TodoWidget(props: TodoWidgetProps) {
  const [todos, setTodos] = createSignal<TodoItem[]>([
    { id: '1', text: 'Review project proposals', completed: false },
    { id: '2', text: 'Update dashboard metrics', completed: true },
    { id: '3', text: 'Prepare team meeting agenda', completed: false },
    { id: '4', text: 'Follow up with clients', completed: false }
  ])
  const [newTodo, setNewTodo] = createSignal('')

  const addTodo = () => {
    const text = newTodo().trim()
    if (text) {
      const newItem: TodoItem = {
        id: Date.now().toString(),
        text,
        completed: false
      }
      setTodos(prev => [...prev, newItem])
      setNewTodo('')
    }
  }

  const toggleTodo = (id: string) => {
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id))
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  return (
    <BaseWidget {...props}>
      <div class={styles.container}>
        {/* Add new todo */}
        <div class={styles.addTodoContainer}>
          <input
            type="text"
            value={newTodo()}
            onInput={(e) => setNewTodo(e.currentTarget.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add new task..."
            class={styles.input}
          />
          <button
            onClick={addTodo}
            class={styles.addButton}
          >
            +
          </button>
        </div>

        {/* Todo list */}
        <div class={styles.todoList}>
          <For 
            each={todos()}
            fallback={
              <div class={styles.emptyState}>
                <div class={styles.emptyIcon}>📝</div>
                <p class={styles.emptyText}>No todos yet. Add one above!</p>
              </div>
            }
          >
            {(todo) => (
              <div class={styles.todoItem}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  class={styles.checkbox}
                />
                <span class={`${styles.todoText} ${
                  todo.completed 
                    ? styles.todoTextCompleted
                    : styles.todoTextActive
                }`}>
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  class={styles.deleteButton}
                >
                  <span class={styles.deleteIcon}>🗑</span>
                </button>
              </div>
            )}
          </For>
        </div>

        {/* Stats */}
        <div class={styles.stats}>
          {todos().filter(t => t.completed).length} of {todos().length} completed
        </div>
      </div>
    </BaseWidget>
  )
}