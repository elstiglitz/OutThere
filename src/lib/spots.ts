import { supabase } from './supabase'
import type { Photo, Spot, SpotStatus, SpotType } from '../types'

const SIGNED_URL_TTL = 60 * 60 // seconds

export async function listSpots(): Promise<Spot[]> {
  const { data, error } = await supabase.from('spots').select('*').order('created_at')
  if (error) throw error
  return data as Spot[]
}

export async function createSpot(input: { name: string; type: SpotType; status: SpotStatus; lat: number; lng: number; details?: Spot['details'] }): Promise<Spot> {
  const { data, error } = await supabase.from('spots').insert(input).select().single()
  if (error) throw error
  return data as Spot
}

export async function updateSpot(id: string, patch: Partial<Pick<Spot, 'name' | 'type' | 'status' | 'description' | 'details' | 'lat' | 'lng'>>) {
  const { error } = await supabase.from('spots').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteSpot(id: string) {
  // Remove files first; the photo rows go with the spot via ON DELETE CASCADE.
  const { data: rows } = await supabase.from('photos').select('path').eq('spot_id', id)
  if (rows?.length) await supabase.storage.from('photos').remove(rows.map((r) => r.path))
  const { error } = await supabase.from('spots').delete().eq('id', id)
  if (error) throw error
}

export async function listPhotos(spotId: string): Promise<Photo[]> {
  const { data, error } = await supabase.from('photos').select('*').eq('spot_id', spotId).order('created_at')
  if (error) throw error
  if (!data.length) return []
  const { data: signed, error: signError } = await supabase.storage
    .from('photos')
    .createSignedUrls(data.map((p) => p.path), SIGNED_URL_TTL)
  if (signError) throw signError
  return data.map((p, i) => ({ ...p, url: signed[i].signedUrl })) as Photo[]
}

export async function uploadPhoto(spotId: string, file: File): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Not signed in')
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${spotId}/${crypto.randomUUID()}.${ext}`
  const { error: upError } = await supabase.storage.from('photos').upload(path, file, { contentType: file.type })
  if (upError) throw upError
  const { error } = await supabase.from('photos').insert({ spot_id: spotId, path })
  if (error) {
    await supabase.storage.from('photos').remove([path])
    throw error
  }
}

export async function updatePhotoCaption(id: string, caption: string) {
  const { error } = await supabase.from('photos').update({ caption }).eq('id', id)
  if (error) throw error
}

export async function deletePhoto(photo: Photo) {
  await supabase.storage.from('photos').remove([photo.path])
  const { error } = await supabase.from('photos').delete().eq('id', photo.id)
  if (error) throw error
}
