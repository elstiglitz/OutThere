import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { SPOT_TYPES, type Spot } from '../types'
import { BASEMAPS, buildStyle } from '../lib/basemaps'
import type { Place } from '../lib/geocode'
import type { Bounds, Candidate } from '../lib/discover'

const colorOf = (type: string) => SPOT_TYPES.find((t) => t.value === type)?.color ?? '#2F6B4F'

interface Props {
  spots: Spot[]
  selectedId: string | null
  draft: { lat: number; lng: number } | null
  basemap: string
  flyTo: Place | null
  candidates: Candidate[]
  selectedCandidateId: string | null
  onSelectCandidate: (id: string) => void
  onViewChange: (b: Bounds) => void
  onSelect: (id: string) => void
  onMapClick: (lat: number, lng: number) => void
}

function makePin(color: string, label: string) {
  const el = document.createElement('button')
  el.className = 'pin'
  el.setAttribute('aria-label', label)
  el.innerHTML = `<svg viewBox="0 0 24 32" width="30" height="40" aria-hidden="true"><path d="M12 31C12 31 2 19.5 2 11.5a10 10 0 0 1 20 0C22 19.5 12 31 12 31Z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="12" cy="11.5" r="3.6" fill="#fff"/></svg>`
  return el
}

function makeNumberedPin(color: string, n: number, label: string) {
  const el = document.createElement('button')
  el.className = 'pin candidate'
  el.setAttribute('aria-label', label)
  el.innerHTML = `<svg viewBox="0 0 24 32" width="30" height="40" aria-hidden="true"><path d="M12 31C12 31 2 19.5 2 11.5a10 10 0 0 1 20 0C22 19.5 12 31 12 31Z" fill="#fff" stroke="${color}" stroke-width="2.5"/><text x="12" y="15" text-anchor="middle" font-size="11" font-weight="700" fill="${color}" font-family="system-ui, sans-serif">${n}</text></svg>`
  return el
}

export function SpotMap({ spots, selectedId, draft, basemap, flyTo, candidates, selectedCandidateId, onSelectCandidate, onViewChange, onSelect, onMapClick }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map())
  const draftMarker = useRef<maplibregl.Marker | null>(null)
  const candidatePins = useRef<maplibregl.Marker[]>([])
  const handlers = useRef({ onSelect, onMapClick, onSelectCandidate, onViewChange })
  handlers.current = { onSelect, onMapClick, onSelectCandidate, onViewChange }

  useEffect(() => {
    const m = new maplibregl.Map({ container: container.current!, style: buildStyle(), center: [6.3, 44.9], zoom: 5 })
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    m.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')
    m.on('click', (e) => handlers.current.onMapClick(e.lngLat.lat, e.lngLat.lng))
    const reportView = () => {
      const b = m.getBounds()
      handlers.current.onViewChange({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() })
    }
    m.on('moveend', reportView)
    reportView()
    map.current = m
    const pins = markers.current
    return () => {
      pins.clear()
      m.remove()
    }
  }, [])

  // Sync markers with the spot list.
  useEffect(() => {
    const m = map.current!
    const pins = markers.current
    const seen = new Set<string>()
    for (const s of spots) {
      seen.add(s.id)
      let marker = pins.get(s.id)
      if (!marker) {
        const el = makePin(colorOf(s.type), s.name)
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          handlers.current.onSelect(s.id)
        })
        marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([s.lng, s.lat]).addTo(m)
        pins.set(s.id, marker)
      } else {
        marker.setLngLat([s.lng, s.lat])
        const el = marker.getElement()
        el.setAttribute('aria-label', s.name)
        el.querySelector('path')?.setAttribute('fill', colorOf(s.type))
      }
    }
    for (const [id, marker] of pins) {
      if (!seen.has(id)) {
        marker.remove()
        pins.delete(id)
      }
    }
  }, [spots])

  useEffect(() => {
    for (const [id, marker] of markers.current) marker.getElement().classList.toggle('selected', id === selectedId)
  }, [selectedId, spots])

  // Numbered pins for Discover results; the number matches the list.
  useEffect(() => {
    for (const p of candidatePins.current) p.remove()
    candidatePins.current = candidates.map((c, i) => {
      const el = makeNumberedPin(colorOf(c.type), i + 1, `${i + 1}. ${c.name}`)
      el.dataset.id = c.id
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        handlers.current.onSelectCandidate(c.id)
      })
      return new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([c.lng, c.lat]).addTo(map.current!)
    })
  }, [candidates])

  useEffect(() => {
    for (const p of candidatePins.current) p.getElement().classList.toggle('selected', p.getElement().dataset.id === selectedCandidateId)
    const c = candidates.find((x) => x.id === selectedCandidateId)
    if (c) map.current?.easeTo({ center: [c.lng, c.lat], duration: 500 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCandidateId])

  // Pin shown while the new-spot form is open.
  useEffect(() => {
    draftMarker.current?.remove()
    draftMarker.current = null
    if (draft) {
      draftMarker.current = new maplibregl.Marker({ element: makePin('#6B7280', 'New spot'), anchor: 'bottom' })
        .setLngLat([draft.lng, draft.lat])
        .addTo(map.current!)
    }
  }, [draft])

  // Show only the chosen basemap.
  useEffect(() => {
    const m = map.current!
    const apply = () => {
      for (const b of BASEMAPS) m.setLayoutProperty(b.id, 'visibility', b.id === basemap ? 'visible' : 'none')
    }
    if (m.isStyleLoaded()) apply()
    else m.once('load', apply)
  }, [basemap])

  // Jump to a place picked in the search box.
  useEffect(() => {
    if (!flyTo) return
    if (flyTo.bbox) map.current?.fitBounds(flyTo.bbox, { padding: 60, maxZoom: 13, duration: 800 })
    else map.current?.easeTo({ center: [flyTo.lng, flyTo.lat], zoom: 11, duration: 800 })
  }, [flyTo])

  // Fly to a spot when it is selected.
  useEffect(() => {
    const s = spots.find((x) => x.id === selectedId)
    if (s) map.current?.easeTo({ center: [s.lng, s.lat], zoom: Math.max(map.current.getZoom(), 11), duration: 600 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  return <div ref={container} className="map" />
}
