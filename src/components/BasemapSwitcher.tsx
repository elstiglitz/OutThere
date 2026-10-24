import { BASEMAPS } from '../lib/basemaps'

export function BasemapSwitcher({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="basemaps" role="radiogroup" aria-label="Basemap">
      {BASEMAPS.map((b) => (
        <button
          key={b.id}
          type="button"
          role="radio"
          aria-checked={value === b.id}
          className={value === b.id ? 'on' : ''}
          onClick={() => onChange(b.id)}
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}
