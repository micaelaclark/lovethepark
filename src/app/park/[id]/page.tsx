'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase, Park } from '@/lib/supabase'

export default function ParkPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [park, setPark] = useState<Park | null>(null)
  const [reflection, setReflection] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('parks').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setPark(data)
        setReflection(data.reflection ?? '')
      }
    })
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

  async function saveReflection() {
    setSaving(true)
    await supabase.from('parks').update({ reflection }).eq('id', id)
    setPark(p => p ? { ...p, reflection } : p)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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

        {/* Reflection */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-green-900 mb-3">Reflection</h2>
          <textarea
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            placeholder="What did you love about this park? What did you see, smell, hear? How did it make you feel?"
            rows={6}
            className="w-full border border-gray-200 rounded-xl p-3 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none text-sm"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={saveReflection}
              disabled={saving}
              className="px-5 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save reflection'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
