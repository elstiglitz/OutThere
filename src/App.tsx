import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isConfigured, supabase } from './lib/supabase'
import { createSpot, deleteSpot, listSpots, updateSpot } from './lib/spots'
import type { Spot, SpotStatus, SpotType } from './types'
import type { Place } from './lib/geocode'
import { DEFAULT_BASEMAP } from './lib/basemaps'
import { Filters } from './components/Filters'
import { ALL_FILTERS, matchesFilters, type FilterState } from './lib/filters'
import { BasemapSwitcher } from './components/BasemapSwitcher'
import { Search } from './components/Search'
import { Login } from './components/Login'
import { SpotMap } from './components/Map'
import { NewSpotForm } from './components/NewSpotForm'
import { SpotPanel } from './components/SpotPanel'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [spots, setSpots] = useState<Spot[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<FilterState>(ALL_FILTERS)
  const [basemap, setBasemap] = useState(() => {
    try { return localStorage.getItem('basemap') || DEFAULT_BASEMAP } catch { return DEFAULT_BASEMAP }
  })
  const [flyTo, setFlyTo] = useState<Place | null>(null)

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    listSpots().then(setSpots).catch((e) => setError(e.message))
  }, [session])

  if (!isConfigured) {
    return (
      <main className="login">
        <div className="stack">
          <h1>Almost there</h1>
          <p>Copy <code>.env.example</code> to <code>.env</code>, fill in your Supabase URL and anon key, then restart <code>npm run dev</code>.</p>
        </div>
      </main>
    )
  }
  if (session === undefined) return null
  if (!session) return <Login />

  const selected = spots.find((s) => s.id === selectedId) ?? null

  async function addSpot(name: string, type: SpotType, status: SpotStatus, elevation: number | null) {
    if (!draft) return
    try {
      const spot = await createSpot({ name, type, status, ...draft, details: elevation === null ? {} : { elevation_m: elevation } })
      setSpots((all) => [...all, spot])
      setDraft(null)
      setSelectedId(spot.id)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function patchSpot(id: string, patch: Partial<Spot>) {
    const before = spots
    setSpots((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    try {
      await updateSpot(id, patch)
    } catch (e) {
      setSpots(before)
      setError((e as Error).message)
    }
  }

  async function removeSpot(id: string) {
    try {
      await deleteSpot(id)
      setSpots((all) => all.filter((s) => s.id !== id))
      setSelectedId(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const visible = spots.filter((s) => matchesFilters(s, filters))
  const hidden = spots.length - visible.length

  function chooseBasemap(id: string) {
    setBasemap(id)
    try { localStorage.setItem('basemap', id) } catch { /* private mode: ignore */ }
  }

  const panelOpen = Boolean(draft || selected)

  return (
    <div className="app">
      <SpotMap
        spots={visible}
        basemap={basemap}
        flyTo={flyTo}
        selectedId={selectedId}
        draft={draft}
        onSelect={(id) => { setDraft(null); setSelectedId(id) }}
        onMapClick={(lat, lng) => { setSelectedId(null); setDraft({ lat, lng }) }}
      />

      <header className="topbar">
        <strong>OutThere</strong>
        <span className="muted">
          {hidden ? `${visible.length} of ${spots.length} spots` : `${spots.length} ${spots.length === 1 ? 'spot' : 'spots'}`}
        </span>
        <button className="ghost small" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </header>

      <div className="toolbar">
        <Search
          spots={spots}
          onPickSpot={(id) => {
            const s = spots.find((x) => x.id === id)
            // Make sure a filtered-out spot is still reachable from search.
            if (s && !matchesFilters(s, filters)) setFilters(ALL_FILTERS)
            setDraft(null)
            setSelectedId(id)
          }}
          onPickPlace={setFlyTo}
        />
      </div>
      <Filters value={filters} onChange={setFilters} />
      <BasemapSwitcher value={basemap} onChange={chooseBasemap} />

      {!panelOpen && spots.length === 0 && <p className="hint">Click anywhere on the map to add your first spot.</p>}
      {error && <p className="toast error" role="alert" onClick={() => setError('')}>{error}</p>}

      {panelOpen && (
        <aside className="panel">
          {draft ? (
            <NewSpotForm key={`${draft.lat},${draft.lng}`} lat={draft.lat} lng={draft.lng} onSave={addSpot} onCancel={() => setDraft(null)} />
          ) : selected ? (
            <SpotPanel
              key={selected.id}
              spot={selected}
              onChange={(patch) => patchSpot(selected.id, patch)}
              onDelete={() => removeSpot(selected.id)}
              onClose={() => setSelectedId(null)}
            />
          ) : null}
        </aside>
      )}
    </div>
  )
}
