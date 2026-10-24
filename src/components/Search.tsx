import { useEffect, useRef, useState } from 'react'
import { searchPlaces, type Place } from '../lib/geocode'
import { SPOT_TYPES, type Spot } from '../types'

interface Props {
  spots: Spot[]
  onPickSpot: (id: string) => void
  onPickPlace: (place: Place) => void
}

export function Search({ spots, onPickSpot, onPickPlace }: Props) {
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const root = useRef<HTMLDivElement>(null)

  const q = query.trim()
  const mySpots = q ? spots.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5) : []

  // Debounced place lookup. Nominatim asks for at most one request per second.
  useEffect(() => {
    if (q.length < 3) return
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setStatus('loading')
      try {
        setPlaces(await searchPlaces(q, ctrl.signal))
        setStatus('idle')
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setStatus('error')
      }
    }, 600)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [q])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function done() {
    setOpen(false)
    setQuery('')
    setPlaces([])
  }

  const shownPlaces = q.length >= 3 ? places : []
  const showList = open && q.length > 0

  return (
    <div className="search" ref={root}>
      <label htmlFor="search-input" className="sr">Search places and your spots</label>
      <input
        id="search-input"
        type="search"
        autoComplete="off"
        placeholder="Search a place or one of your spots"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      />
      {showList && (
        <ul className="results">
          {mySpots.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => { onPickSpot(s.id); done() }}>
                <span className="dot" style={{ background: SPOT_TYPES.find((t) => t.value === s.type)?.color }} />
                <span>{s.name}</span>
                <span className="muted tiny">Your spot</span>
              </button>
            </li>
          ))}
          {shownPlaces.map((p) => (
            <li key={`${p.lat},${p.lng},${p.name}`}>
              <button type="button" onClick={() => { onPickPlace(p); done() }}>
                <span className="dot ring" />
                <span className="clip">{p.name}</span>
              </button>
            </li>
          ))}
          {status === 'loading' && <li className="note">Searching…</li>}
          {status === 'error' && <li className="note error">Place search is unavailable right now.</li>}
          {status === 'idle' && q.length >= 3 && !mySpots.length && !shownPlaces.length && <li className="note">No matches.</li>}
          {q.length < 3 && !mySpots.length && <li className="note">Keep typing…</li>}
        </ul>
      )}
    </div>
  )
}
