import { Component, createSignal, Show } from 'solid-js'
import styles from './OptimizedImage.module.css'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  class?: string
  loading?: 'lazy' | 'eager'
  sizes?: string
  placeholder?: 'blur' | 'empty'
  formats?: boolean // Enable format conversion (if API supports it)
  optimize?: boolean // Use local image optimization endpoint
}

const OptimizedImage: Component<OptimizedImageProps> = (props) => {
  const [imageLoaded, setImageLoaded] = createSignal(false)
  const [imageError, setImageError] = createSignal(false)

  // Generate blur placeholder (you could also use a base64 encoded tiny version)
  const placeholderSrc = `data:image/svg+xml,%3Csvg width='${props.width || 400}' height='${props.height || 300}' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E`

  const handleLoad = () => {
    setImageLoaded(true)
  }

  const handleError = () => {
    setImageError(true)
  }

  // Generate URL for our optimization endpoint
  const getOptimizedUrl = (width?: number, height?: number, format?: string, quality?: number) => {
    if (!props.optimize) return props.src
    
    const params = new URLSearchParams({
      url: props.src,
      ...(width && { w: width.toString() }),
      ...(height && { h: height.toString() }),
      ...(format && { format }),
      ...(quality && { q: quality.toString() })
    })
    
    return `/api/image?${params.toString()}`
  }
  
  // Determine if we should use srcset or single image
  const shouldUseSrcSet = () => {
    // If specific width/height are provided, use single optimized image
    if (props.width && props.height) {
      return false
    }
    // Otherwise, use responsive srcset
    return true
  }

  // Generate responsive srcset
  const generateSrcSet = (format?: string) => {
    if (!shouldUseSrcSet()) {
      return undefined // Use single image instead
    }

    if (props.optimize) {
      // Generate responsive sizes for optimization endpoint
      const sizes = [200, 400, 800, 1200]
      return sizes
        .map(size => `${getOptimizedUrl(size, undefined, format)} ${size}w`)
        .join(', ')
    }
    
    // Fallback to original logic for external APIs
    const base = props.src
    const separator = base.includes('?') ? '&' : '?'
    const formatParam = format ? `&format=${format}` : ''
    
    if (props.src.includes('cloudinary') || 
        props.src.includes('imgix') || 
        props.src.includes('images.unsplash')) {
      return `${base}${separator}w=200${formatParam} 200w, ${base}${separator}w=400${formatParam} 400w, ${base}${separator}w=800${formatParam} 800w`
    }
    return undefined
  }

  return (
    <div 
      class={`${styles.imageWrapper} ${props.class || ''}`}
      style={{
        '--image-width': props.width ? `${props.width}px` : 'auto'
      }}
    >
      <Show
        when={!imageError()}
        fallback={
          <div class={styles.errorPlaceholder}>
            <span>📷</span>
            <p>Image failed to load</p>
          </div>
        }
      >
        {/* Placeholder */}
        <Show when={props.placeholder === 'blur' && !imageLoaded()}>
          <img
            src={placeholderSrc}
            alt=""
            class={styles.placeholder}
            aria-hidden="true"
          />
        </Show>

        {/* Main image with picture element for format selection */}
        <Show
          when={props.formats !== false}
          fallback={
            <img
              src={props.optimize ? getOptimizedUrl(props.width, props.height) : props.src}
              srcset={shouldUseSrcSet() ? generateSrcSet() : undefined}
              sizes={shouldUseSrcSet() ? props.sizes : undefined}
              alt={props.alt}
              class={`${styles.image} ${imageLoaded() ? styles.loaded : ''}`}
              loading={props.loading || 'lazy'}
              onLoad={handleLoad}
              onError={handleError}
              decoding="async"
            />
          }
        >
          <picture>
            {/* AVIF format (best compression, limited support) */}
            <source
              srcset={shouldUseSrcSet() ? generateSrcSet('avif') : getOptimizedUrl(props.width, props.height, 'avif')}
              type="image/avif"
              sizes={shouldUseSrcSet() ? props.sizes : undefined}
            />
            
            {/* WebP format (good compression, wide support) */}
            <source
              srcset={shouldUseSrcSet() ? generateSrcSet('webp') : getOptimizedUrl(props.width, props.height, 'webp')}
              type="image/webp"
              sizes={shouldUseSrcSet() ? props.sizes : undefined}
            />
            
            {/* Fallback to original format */}
            <img
              src={props.optimize ? getOptimizedUrl(props.width, props.height) : props.src}
              srcset={shouldUseSrcSet() ? generateSrcSet() : undefined}
              sizes={shouldUseSrcSet() ? props.sizes : undefined}
              alt={props.alt}
              class={`${styles.image} ${imageLoaded() ? styles.loaded : ''}`}
              loading={props.loading || 'lazy'}
              onLoad={handleLoad}
              onError={handleError}
              decoding="async"
            />
          </picture>
        </Show>
      </Show>
    </div>
  )
}

export default OptimizedImage