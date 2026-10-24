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
      <fieldset>
        <legend>Type</legend>
        {SPOT_TYPES.map((t) => (
          <label key={t.value} className="check">
            <input
              type="checkbox"
              checked={value.types.has(t.value)}
              onChange={() => onChange({ ...value, types: toggled(value.types, t.value) })}
            />
            <span className="dot" style={{ background: t.color }} />
            {t.label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Status</legend>
        {SPOT_STATUSES.map((s) => (
          <label key={s.value} className="check">
            <input
              type="checkbox"
              checked={value.statuses.has(s.value)}
              onChange={() => onChange({ ...value, statuses: toggled(value.statuses, s.value) })}
            />
            {s.label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Other</legend>
        <label className="check">
          <input type="checkbox" checked={value.dogsOnly} onChange={() => onChange({ ...value, dogsOnly: !value.dogsOnly })} />
          Dogs allowed
        </label>
      </fieldset>
    </div>
  )
}
