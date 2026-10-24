import { useCallback, useEffect, useRef, useState } from 'react'
import { DETAIL_FIELDS, SPOT_STATUSES, SPOT_TYPES, type Photo, type Spot, type SpotStatus, type SpotType } from '../types'
import { deletePhoto, listPhotos, updatePhotoCaption, uploadPhoto } from '../lib/spots'

interface Props {
  spot: Spot
  onChange: (patch: Partial<Spot>) => void
  onDelete: () => void
  onClose: () => void
}

export function SpotPanel({ spot, onChange, onDelete, onClose }: Props) {
  const [name, setName] = useState(spot.name)
  const [description, setDescription] = useState(spot.description)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const loadPhotos = useCallback(async () => {
    try {
      setPhotos(await listPhotos(spot.id))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [spot.id])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  function setDetail(key: string, raw: string) {
    const field = DETAIL_FIELDS[spot.type].find((f) => f.key === key)
    const value = raw.trim()
    const next = { ...spot.details }
    if (value === '') delete next[key]
    else next[key] = field?.kind === 'number' ? Number(value) : value
    if (JSON.stringify(next) !== JSON.stringify(spot.details)) onChange({ details: next })
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setError('')
    try {
      for (const f of Array.from(files)) await uploadPhoto(spot.id, f)
      await loadPhotos()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function removePhoto(p: Photo) {
    try {
      await deletePhoto(p)
      setLightbox(null)
      await loadPhotos()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function saveCaption(p: Photo, caption: string) {
    if (caption === p.caption) return
    try {
      await updatePhotoCaption(p.id, caption)
      setPhotos((all) => all.map((x) => (x.id === p.id ? { ...x, caption } : x)))
      setLightbox((l) => (l && l.id === p.id ? { ...l, caption } : l))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="stack">
      <div className="row between">
        <span className="mono muted">{spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}</span>
        <button className="ghost small" onClick={onClose} aria-label="Close panel">Close</button>
      </div>

      <label htmlFor="spot-name" className="sr">Name</label>
      <input id="spot-name" className="title" value={name} onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== spot.name && onChange({ name: name.trim() })} />

      <div className="seg" role="radiogroup" aria-label="Type">
        {SPOT_TYPES.map((t) => (
          <label key={t.value} className={spot.type === t.value ? 'on' : ''}>
            <input type="radio" name="spot-type" checked={spot.type === t.value} onChange={() => onChange({ type: t.value as SpotType })} />
            {t.label}
          </label>
        ))}
      </div>

      <div className="seg" role="radiogroup" aria-label="Status">
        {SPOT_STATUSES.map((st) => (
          <label key={st.value} className={spot.status === st.value ? 'on' : ''}>
            <input type="radio" name="spot-status" checked={spot.status === st.value} onChange={() => onChange({ status: st.value as SpotStatus })} />
            {st.label}
          </label>
        ))}
      </div>

      <div className="details">
        {DETAIL_FIELDS[spot.type].map((f) => (
          <div key={f.key} className="field">
            <label htmlFor={`d-${f.key}`}>{f.label}{f.unit ? ` (${f.unit})` : ''}</label>
            {f.kind === 'select' ? (
              <select id={`d-${f.key}`} value={String(spot.details[f.key] ?? '')} onChange={(e) => setDetail(f.key, e.target.value)}>
                <option value="">Not set</option>
                {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                id={`d-${f.key}`}
                key={`${spot.id}-${f.key}`}
                type={f.kind === 'number' ? 'number' : 'text'}
                inputMode={f.kind === 'number' ? 'decimal' : undefined}
                min={f.kind === 'number' ? 0 : undefined}
                defaultValue={String(spot.details[f.key] ?? '')}
                placeholder={f.placeholder}
                onBlur={(e) => setDetail(f.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <label htmlFor="spot-notes">Notes</label>
      <textarea id="spot-notes" rows={5} value={description} placeholder="Access, water, wind, where to pitch, the view…"
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => description !== spot.description && onChange({ description })} />

      <div className="row between">
        <h3>Photos <span className="muted mono">{photos.length || ''}</span></h3>
        <button className="small" onClick={() => fileInput.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Add photos'}
        </button>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      {photos.length === 0 && !uploading && <p className="muted">No photos yet.</p>}
      <div className="photos">
        {photos.map((p) => (
          <button key={p.id} className="thumb" onClick={() => setLightbox(p)} aria-label={p.caption || 'Open photo'}>
            <img src={p.url} alt={p.caption} loading="lazy" />
          </button>
        ))}
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="danger">
        {confirmDelete ? (
          <div className="row">
            <span>Delete this spot and its photos?</span>
            <button className="destructive small" onClick={onDelete}>Delete</button>
            <button className="ghost small" onClick={() => setConfirmDelete(false)}>Keep</button>
          </div>
        ) : (
          <button className="ghost small" onClick={() => setConfirmDelete(true)}>Delete spot</button>
        )}
      </div>

      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo" onClick={() => setLightbox(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.caption} />
            <div className="row">
              <label htmlFor="caption" className="sr">Caption</label>
              <input id="caption" key={lightbox.id} defaultValue={lightbox.caption} placeholder="Add a caption"
                onBlur={(e) => saveCaption(lightbox, e.target.value)} />
              <button className="destructive small" onClick={() => removePhoto(lightbox)}>Delete</button>
              <button className="ghost small" onClick={() => setLightbox(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
