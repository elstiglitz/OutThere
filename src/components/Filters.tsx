import { SPOT_STATUSES, SPOT_TYPES } from '../types'
import type { FilterState } from '../lib/filters'

function toggled<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

export function Filters({ value, onChange }: { value: FilterState; onChange: (f: FilterState) => void }) {
  return (
    <div className="filters" role="group" aria-label="Filter spots">
      {SPOT_TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          className={`chip ${value.types.has(t.value) ? 'on' : ''}`}
          aria-pressed={value.types.has(t.value)}
          onClick={() => onChange({ ...value, types: toggled(value.types, t.value) })}
        >
          <span className="dot" style={{ background: t.color }} />
          {t.label}
        </button>
      ))}
      <span className="sep" />
      {SPOT_STATUSES.map((s) => (
        <button
          key={s.value}
          type="button"
          className={`chip ${value.statuses.has(s.value) ? 'on' : ''}`}
          aria-pressed={value.statuses.has(s.value)}
          onClick={() => onChange({ ...value, statuses: toggled(value.statuses, s.value) })}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
