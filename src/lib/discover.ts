import type { SpotType } from '../types'

export interface Bounds {
  west: number
  south: number
  east: number
  north: number
}

export interface Candidate {
  id: string // "node/123", unique within OpenStreetMap
  name: string
  type: SpotType
  kind: string
  lat: number
  lng: number
  ele: number | null
  distanceKm: number | null
  score: number
  osmUrl: string
}

type Tags = Record<string, string>
interface OsmElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Tags
}

const OVERPASS = 'https://overpass-api.de/api/interpreter'
const MAX_LAT_SPAN = 1 // degrees; Overpass times out on much bigger areas
const MAX_LNG_SPAN = 1.5
const TOP_N = 10

/** What to look for per category. Adding surf or dive later means adding an entry here and in kindOf(). */
const QUERIES: Record<SpotType, (bbox: string) => string> = {
  hike: (b) => `
    relation["route"~"^(hiking|foot)$"]["name"](${b});
    nwr["natural"="peak"]["name"](${b});
    nwr["tourism"="viewpoint"]["name"](${b});`,
  bivouac: (b) => `
    nwr["tourism"="wilderness_hut"]["name"](${b});
    nwr["tourism"="alpine_hut"]["name"](${b});
    nwr["amenity"="shelter"]["name"](${b});
    nwr["tourism"="camp_site"]["name"](${b});`,
}

function kindOf(t: Tags): string {
  if (t.route) return 'Hiking route'
  if (t.natural === 'peak') return 'Peak'
  if (t.tourism === 'viewpoint') return 'Viewpoint'
  if (t.tourism === 'wilderness_hut') return 'Wilderness hut'
  if (t.tourism === 'alpine_hut') return 'Alpine hut'
  if (t.amenity === 'shelter') return 'Shelter'
  if (t.tourism === 'camp_site') return 'Camp site'
  return 'Place'
}

const KIND_BONUS: Record<string, number> = {
  'Hiking route': 1, Peak: 1, Viewpoint: 0, 'Wilderness hut': 3, 'Alpine hut': 2, Shelter: 2, 'Camp site': 0,
}
const NETWORK_BONUS: Record<string, number> = { iwn: 4, nwn: 3, rwn: 2, lwn: 1 }

function num(v: string | undefined): number | null {
  const n = parseFloat(v ?? '')
  return Number.isFinite(n) ? n : null
}

/** OpenStreetMap has no ratings, so "top" means most notable: documented, well-tagged, high, long, signed. */
function scoreOf(t: Tags, kind: string, ele: number | null): number {
  let s = KIND_BONUS[kind] ?? 0
  if (t.wikipedia || t.wikidata) s += 6
  if (t.website || t['contact:website']) s += 1
  if (t.description) s += 1
  if (t.image || t.wikimedia_commons) s += 1
  if (ele !== null) s += Math.min(ele / 1000, 3)
  const prominence = num(t.prominence)
  if (prominence !== null) s += Math.min(prominence / 500, 2)
  if (t.network) s += NETWORK_BONUS[t.network] ?? 0
  if (t.ref) s += 0.5
  if (t.backcountry === 'yes') s += 2
  return s
}

export async function discover(type: SpotType, b: Bounds, signal?: AbortSignal): Promise<Candidate[]> {
  if (b.north - b.south > MAX_LAT_SPAN || b.east - b.west > MAX_LNG_SPAN) {
    throw new Error('Zoom in a little: Discover searches areas up to about 100 km across.')
  }
  const bbox = [b.south, b.west, b.north, b.east].map((n) => n.toFixed(5)).join(',')
  const query = `[out:json][timeout:25];(${QUERIES[type](bbox)});out center tags 600;`
  const res = await fetch(OVERPASS, { method: 'POST', body: new URLSearchParams({ data: query }), signal })
  if (!res.ok) {
    throw new Error(res.status === 429 || res.status === 504 ? 'The map data service is busy. Try again in a moment.' : 'Discover is unavailable right now')
  }
  const { elements } = (await res.json()) as { elements: OsmElement[] }

  const best = new Map<string, Candidate>() // one entry per name, so a route split into parts shows once
  for (const el of elements) {
    const tags = el.tags ?? {}
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (!tags.name || lat === undefined || lng === undefined) continue
    const kind = kindOf(tags)
    const ele = num(tags.ele)
    const candidate: Candidate = {
      id: `${el.type}/${el.id}`,
      name: tags.name,
      type,
      kind,
      lat,
      lng,
      ele,
      distanceKm: kind === 'Hiking route' ? num(tags.distance) : null,
      score: scoreOf(tags, kind, ele),
      osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    }
    const key = tags.name.toLowerCase()
    if (!best.has(key) || best.get(key)!.score < candidate.score) best.set(key, candidate)
  }
  return [...best.values()].sort((a, c) => c.score - a.score).slice(0, TOP_N)
}
