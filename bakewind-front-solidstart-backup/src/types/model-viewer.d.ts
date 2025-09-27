declare module '@google/model-viewer' {
  // This ensures the module can be imported
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': {
        src?: string
        alt?: string
        'camera-controls'?: boolean | string
        'auto-rotate'?: boolean | string
        'shadow-intensity'?: string
        'environment-image'?: string
        style?: string | { [key: string]: string | number }
        ref?: any
        onLoad?: (event: Event) => void
        onError?: (event: Event) => void
      }
    }
  }
}