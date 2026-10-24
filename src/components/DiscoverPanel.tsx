import { SPOT_TYPES, type SpotType } from '../types'
import type { Candidate } from '../lib/discover'

interface Props {
  type: SpotType
  onType: (t: SpotType) => void
  results: Candidate[] | null // null until the first search
  searching: boolean
  error: string
  selectedId: string | null
  savedIds: Set<string>
  onSearch: () => void
  onSelect: (id: string) => void
  onAdd: (c: Candidate) => void
}

export function DiscoverPanel({ type, onType, results, searching, error, selectedId, savedIds, onSearch, onSelect, onAdd }: Props) {
  const label = SPOT_TYPES.find((t) => t.value === type)?.label.toLowerCase()
  return (
    <div className="stack">
      <h2>Discover</h2>
      <div className="seg" role="radiogroup" aria-label="Category">
        {SPOT_TYPES.map((t) => (
          <label key={t.value} className={type === t.value ? 'on' : ''}>
            <input type="radio" name="discover-type" checked={type === t.value} onChange={() => onType(t.value)} />
            {t.label}
          </label>
        ))}
      </div>
      <button onClick={onSearch} disabled={searching}>{searching ? 'Searching…' : 'Search this area'}</button>
      {error && <p className="error" role="alert">{error}</p>}
      {results && !results.length && !error && (
        <p className="muted">No named {label} places found in this view. Try another area or category.</p>
      )}
      {results && results.length > 0 && (
        <>
          <p className="muted">
            Top {results.length} by notability, from OpenStreetMap. It has no ratings, so documented, high and signed places rank first.
          </p>
          <ol className="candidates">
            {results.map((c, i) => (
              <li key={c.id} className={c.id === selectedId ? 'on' : ''}>
                <button type="button" className="cand-main" onClick={() => onSelect(c.id)}>
                  <span className="rank">{i + 1}</span>
                  <span className="cand-text">
                    <strong>{c.name}</strong>
                    <span className="muted">
                      {[c.kind, c.ele !== null ? `${Math.round(c.ele)} m` : null, c.distanceKm !== null ? `${c.distanceKm} km` : null]
                        .filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
                {savedIds.has(c.id) ? (
                  <span className="muted saved">Saved</span>
                ) : (
                  <button type="button" className="small" onClick={() => onAdd(c)}>Add</button>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
