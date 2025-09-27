import { onCleanup, onMount } from 'solid-js'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  rootMargin?: string
  root?: Element | null
}

export function useIntersectionObserver(
  ref: () => Element | undefined,
  callback: (entry: IntersectionObserverEntry) => void,
  options: UseIntersectionObserverOptions = {}
) {
  let observer: IntersectionObserver | null = null

  onMount(() => {
    const element = ref()
    if (!element) return

    observer = new IntersectionObserver((entries) => {
      entries.forEach(callback)
    }, {
      threshold: options.threshold || 0,
      rootMargin: options.rootMargin || '50px',
      root: options.root || null
    })

    observer.observe(element)
  })

  onCleanup(() => {
    if (observer) {
      observer.disconnect()
    }
  })
}