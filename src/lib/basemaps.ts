import type * as maplibregl from 'maplibre-gl'

export interface Basemap {
  id: string
  label: string
  tiles: string[]
  maxzoom: number
  attribution: string
}

export const BASEMAPS: Basemap[] = [
  {
    id: 'topo',
    label: 'Topo',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
    maxzoom: 19,
    attribution: 'Tiles © Esri — Esri, DeLorme, NAVTEQ, TomTom, Intermap, USGS, NRCan, and others',
  },
  {
    id: 'satellite',
    label: 'Satellite',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    maxzoom: 19,
    attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  },
  {
    id: 'opentopo',
    label: 'OpenTopo',
    tiles: [
      'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
      'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
      'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
    ],
    maxzoom: 17,
    attribution: 'Map data © OpenStreetMap contributors, SRTM | Style © OpenTopoMap (CC-BY-SA)',
  },
]

export const DEFAULT_BASEMAP = 'topo'

/** One style holding every basemap; only the active one is visible. Switching toggles visibility, so pins and view stay put. */
export function buildStyle(): maplibregl.StyleSpecification {
  const sources: maplibregl.StyleSpecification['sources'] = {}
  for (const b of BASEMAPS) {
    sources[b.id] = { type: 'raster', tiles: b.tiles, tileSize: 256, maxzoom: b.maxzoom, attribution: b.attribution }
  }
  return {
    version: 8,
    sources,
    layers: BASEMAPS.map((b) => ({
      id: b.id,
      type: 'raster',
      source: b.id,
      layout: { visibility: b.id === DEFAULT_BASEMAP ? 'visible' : 'none' },
    })),
  }
}
