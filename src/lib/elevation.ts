/** Ground elevation in metres at a point, from the Open-Meteo elevation API (Copernicus 90 m DEM). */
export async function lookupElevation(lat: number, lng: number, signal?: AbortSignal): Promise<number> {
  const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`, { signal })
  if (!res.ok) throw new Error('Elevation lookup is unavailable right now')
  const { elevation } = (await res.json()) as { elevation?: number[] }
  if (!elevation?.length || !Number.isFinite(elevation[0])) throw new Error('No elevation data for this point')
  return Math.round(elevation[0])
}
