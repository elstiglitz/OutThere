export interface Place {
  name: string
  lat: number
  lng: number
  bbox: [number, number, number, number] | null // west, south, east, north
}

/** Place search via OpenStreetMap Nominatim. Fine for one person typing; not for bulk use. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=en&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('Place search is unavailable right now')
  const rows = (await res.json()) as {
    display_name: string
    lat: string
    lon: string
    boundingbox?: [string, string, string, string] // south, north, west, east
  }[]
  return rows.map((r) => ({
    name: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
    bbox: r.boundingbox
      ? [Number(r.boundingbox[2]), Number(r.boundingbox[0]), Number(r.boundingbox[3]), Number(r.boundingbox[1])]
      : null,
  }))
}
