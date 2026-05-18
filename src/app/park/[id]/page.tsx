'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase, Park, Reflection } from '@/lib/supabase'

export default function ParkPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [park, setPark] = useState<Park | null>(null)
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [newReflection, setNewReflection] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: parkData } = await supabase.from('parks').select('*').eq('id', id).single()
      if (!parkData) return
      setPark(parkData)

      const { data: reflData } = await supabase
        .from('reflections')
        .select('*')
        .eq('park_id', id)
        .order('created_at')

      if (reflData && reflData.length === 0 && parkData.reflection) {
        // Migrate legacy single reflection into the new table
        const { data: migrated } = await supabase
          .from('reflections')
          .insert({ park_id: id, text: parkData.reflection })
          .select()
          .single()
        if (migrated) setReflections([migrated])
      } else if (reflData) {
        setReflections(reflData)
      }
    }
    load()
    loadPhotos()
  }, [id])

  async function loadPhotos() {
    const { data } = await supabase.storage.from('park-photos').list(id)
    if (data) {
      const urls = data.map(f => {
        const { data: { publicUrl } } = supabase.storage.from('park-photos').getPublicUrl(`${id}/${f.name}`)
        return publicUrl
      })
      setPhotos(urls)
    }
  }

  async function toggleVisited() {
    if (!park) return
    const newVal = !park.visited
    await supabase.from('parks').update({
      visited: newVal,
      visited_at: newVal ? new Date().toISOString() : null,
    }).eq('id', id)
    setPark(p => p ? { ...p, visited: newVal, visited_at: newVal ? new Date().toISOString() : null } : p)
  }

  async function addReflection() {
    if (!newReflection.trim()) return
    setSaving(true)
    const text = newReflection.trim()
    const { data } = await supabase
      .from('reflections')
      .insert({ park_id: id, text })
      .select()
      .single()
    if (data) {
      setReflections(prev => [...prev, data])
      await supabase.from('parks').update({ reflection: text }).eq('id', id)
      setPark(p => p ? { ...p, reflection: text } : p)
      setNewReflection('')
    }
    setSaving(false)
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const filename = `${Date.now()}-${file.name}`
    await supabase.storage.from('park-photos').upload(`${id}/${filename}`, file)
    const { data: { publicUrl } } = supabase.storage.from('park-photos').getPublicUrl(`${id}/${filename}`)
    if (photos.length === 0) {
      await supabase.from('parks').update({ cover_photo_url: publicUrl }).eq('id', id)
      setPark(p => p ? { ...p, cover_photo_url: publicUrl } : p)
    }
    await loadPhotos()
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function deletePhoto(url: string) {
    const path = url.split('/park-photos/')[1]
    await supabase.storage.from('park-photos').remove([path])
    const remaining = photos.filter(p => p !== url)
    setPhotos(remaining)
    const newCover = remaining[0] ?? null
    await supabase.from('parks').update({ cover_photo_url: newCover }).eq('id', id)
    setPark(p => p ? { ...p, cover_photo_url: newCover } : p)
  }

  if (!park) {
    return <div className="min-h-screen bg-green-50 flex items-center justify-center text-green-600">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-green-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Back */}
        <button
          onClick={() => router.push('/')}
          className="text-green-600 hover:text-green-800 text-sm mb-6 flex items-center gap-1 transition-colors"
        >
          ← Back to all parks
        </button>

        {/* Park header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-green-900">{park.name}</h1>
              {park.neighborhood && (
                <p className="text-green-500 text-sm mt-1">{park.neighborhood}</p>
              )}
              {park.visited_at && (
                <p className="text-gray-400 text-xs mt-1">
                  Visited {new Date(park.visited_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
            <button
              onClick={toggleVisited}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                park.visited
                  ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {park.visited ? '✅ Visited' : 'Mark as visited'}
            </button>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-green-900">Photos</h2>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : '+ Add photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
          </div>

          {photos.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No photos yet — add one from your visit!</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {photos.map(url => (
                <div key={url} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
                  <Image src={url} alt="Park photo" fill className="object-cover" />
                  <button
                    onClick={() => deletePhoto(url)}
                    className="absolute top-2 right-2 bg-black/50 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reflections */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-green-900 mb-4">
            Reflections {reflections.length > 0 && <span className="text-green-400 font-normal text-sm">({reflections.length})</span>}
          </h2>

          {reflections.length > 0 && (
            <div className="space-y-3 mb-5">
              {reflections.map(r => (
                <div key={r.id} className="bg-green-50 border border-green-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{r.text}</p>
                  <p className="text-gray-400 text-xs mt-1.5">
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={newReflection}
            onChange={e => setNewReflection(e.target.value)}
            placeholder={reflections.length === 0
              ? 'What did you love about this park? What did you see, smell, hear? How did it make you feel?'
              : 'Add another reflection...'}
            rows={4}
            className="w-full border border-gray-200 rounded-xl p-3 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none text-sm"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={addReflection}
              disabled={saving || !newReflection.trim()}
              className="px-5 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add reflection'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
