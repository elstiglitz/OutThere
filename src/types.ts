export type SpotType = 'hike' | 'bivouac'

export const SPOT_TYPES: { value: SpotType; label: string; color: string }[] = [
  { value: 'hike', label: 'Hike', color: '#2F6B4F' },
  { value: 'bivouac', label: 'Bivouac', color: '#C0501B' },
]

export interface Spot {
  id: string
  name: string
  type: SpotType
  status: 'visited' | 'wishlist'
  lat: number
  lng: number
  description: string
  details: Record<string, unknown>
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
