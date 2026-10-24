import { useState } from 'react'
import { SPOT_STATUSES, SPOT_TYPES, type SpotStatus, type SpotType } from '../types'

interface Props {
  lat: number
  lng: number
  onSave: (name: string, type: SpotType, status: SpotStatus) => Promise<void>
  onCancel: () => void
}

export function NewSpotForm({ lat, lng, onSave, onCancel }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<SpotType>('hike')
  const [status, setStatus] = useState<SpotStatus>('visited')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await onSave(name.trim(), type, status)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="stack">
      <h2>New spot</h2>
      <p className="muted mono">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
      <label htmlFor="new-name">Name</label>
      <input id="new-name" autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="Lac de la Muzelle" />
      <fieldset>
        <legend>Type</legend>
        <div className="seg">
          {SPOT_TYPES.map((t) => (
            <label key={t.value} className={type === t.value ? 'on' : ''}>
              <input type="radio" name="type" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Status</legend>
        <div className="seg">
          {SPOT_STATUSES.map((st) => (
            <label key={st.value} className={status === st.value ? 'on' : ''}>
              <input type="radio" name="status" value={st.value} checked={status === st.value} onChange={() => setStatus(st.value)} />
              {st.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="row">
        <button type="submit" disabled={busy || !name.trim()}>{busy ? 'Saving…' : 'Add spot'}</button>
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
