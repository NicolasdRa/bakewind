export interface WidgetConfig {
  id: string
  type: string
  title: string
  position: { x: number; y: number }
  size: 'small' | 'medium' | 'large'
  modelSrc?: string
  modelName?: string
  modelDescription?: string
  environmentImage?: string
  shadowIntensity?: string
}

export interface WidgetType {
  type: string
  icon: string
  name: string
}