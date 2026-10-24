export type SpotType = 'hike' | 'bivouac'
export type SpotStatus = 'visited' | 'wishlist'

export const SPOT_TYPES: { value: SpotType; label: string; color: string }[] = [
  { value: 'hike', label: 'Hike', color: '#2F6B4F' },
  { value: 'bivouac', label: 'Bivouac', color: '#C0501B' },
]

export const SPOT_STATUSES: { value: SpotStatus; label: string }[] = [
  { value: 'visited', label: 'Visited' },
  { value: 'wishlist', label: 'Wishlist' },
]

export interface DetailField {
  key: string
  label: string
  kind: 'text' | 'number' | 'select'
  unit?: string
  options?: string[]
  placeholder?: string
}

/** Type-specific fields, stored in spots.details. Adding surf or dive later means adding an entry here. */
export const DETAIL_FIELDS: Record<SpotType, DetailField[]> = {
  hike: [
    { key: 'distance_km', label: 'Distance', kind: 'number', unit: 'km' },
    { key: 'elevation_gain_m', label: 'Elevation gain', kind: 'number', unit: 'm' },
    { key: 'difficulty', label: 'Difficulty', kind: 'select', options: ['Easy', 'Moderate', 'Hard', 'Expert'] },
    { key: 'water', label: 'Water sources', kind: 'text', placeholder: 'Stream at km 3, hut tap' },
  ],
  bivouac: [
    { key: 'elevation_m', label: 'Elevation', kind: 'number', unit: 'm' },
    { key: 'legal', label: 'Legal situation', kind: 'select', options: ['Allowed', 'Tolerated', 'Restricted', 'Forbidden', 'Unknown'] },
    { key: 'wind', label: 'Wind exposure', kind: 'select', options: ['Sheltered', 'Moderate', 'Exposed'] },
    { key: 'water', label: 'Water nearby', kind: 'text', placeholder: 'Lake 5 min below' },
  ],
}

export interface Spot {
  id: string
  name: string
  type: SpotType
  status: SpotStatus
  lat: number
  lng: number
  description: string
  details: Record<string, string | number>
  created_at: string
}

export interface Photo {
  id: string
  spot_id: string
  path: string
  caption: string
  taken_at: string | null
  url: string // signed URL, filled in on load
}
