// Dashboard layout options
export const LAYOUT_OPTIONS = [
  {
    value: 'grid',
    label: 'Grid',
    mobileIcon: '⊞',
    desktopLabel: 'Grid',
    title: 'Grid Layout'
  },
  {
    value: 'list',
    label: 'List',
    mobileIcon: '☰',
    desktopLabel: 'List',
    title: 'List Layout'
  },
  {
    value: 'masonry',
    label: 'Masonry',
    mobileIcon: '⊡',
    desktopLabel: 'Masonry',
    title: 'Masonry Layout'
  }
]

export type LayoutValue = 'grid' | 'list' | 'masonry'
