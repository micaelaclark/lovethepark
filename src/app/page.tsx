'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Park } from '@/lib/supabase'

function PhotoCarousel({ parks }: { parks: Park[] }) {
  const photos = parks.filter(p => p.cover_photo_url)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (photos.length < 2) return
    const timer = setInterval(() => setCurrent(i => (i + 1) % photos.length), 4000)
    return () => clearInterval(timer)
  }, [photos.length])

  if (photos.length === 0) return null

  const park = photos[current]

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-md mb-6" style={{ height: '420px' }}>
      {photos.map((p, i) => (
        <div key={p.id} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: i === current ? 1 : 0 }}>
          <img src={p.cover_photo_url!} alt={p.name} className="w-full h-full object-cover" />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      <div className="absolute top-0 left-0 right-0 p-5">
        <h1 className="text-white text-3xl font-black tracking-tight drop-shadow-lg">PARK! 2026</h1>
        <p className="text-white/80 text-sm">Boston · Cambridge · Somerville</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="text-white font-semibold text-lg drop-shadow">{park.name}</p>
        {park.neighborhood && <p className="text-white/70 text-sm">{park.neighborhood}</p>}
      </div>
      {photos.length > 1 && (
        <div className="absolute bottom-4 right-5 flex gap-1.5">
          {photos.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [parks, setParks] = useState<Park[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    supabase.from('parks').select('*').order('name').then(({ data }) => {
      if (data) setParks(data)
      setLoading(false)
    })
  }, [])

  const visited = parks.filter(p => p.visited).length
  const total = parks.length
  const pct = total > 0 ? Math.round((visited / total) * 100) : 0

  const visitedParks = parks.filter(p => p.visited)
  const unvisitedParks = parks.filter(p => !p.visited)

  const searchResults = unvisitedParks.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.neighborhood ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-green-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <PhotoCarousel parks={parks} />

        {parks.filter(p => p.cover_photo_url).length === 0 && (
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-black text-green-900 tracking-tight">PARK! 2026</h1>
            <p className="text-green-600 text-sm mt-1">Boston · Cambridge · Somerville</p>
          </div>
        )}

        {/* Progress */}
        <div className="bg-white rounded-2xl shadow-sm px-6 py-4 mb-6">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-green-900 font-semibold">{visited} of {total} visited</span>
            <span className="text-green-600 font-bold">{pct}%</span>
          </div>
          <div className="w-full bg-green-100 rounded-full h-3 overflow-hidden">
            <div className="bg-green-500 h-3 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Visited parks */}
        {loading ? (
          <div className="text-center py-20 text-green-500">Loading...</div>
        ) : (
          <>
            {visitedParks.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-green-500 mb-3 px-1">Parks you've visited</h2>
                <div className="grid grid-cols-2 gap-2">
                  {visitedParks.map((park, i) => {
                    const isLast = i === visitedParks.length - 1
                    const isOdd = visitedParks.length % 2 !== 0
                    const fullWidth = isLast && isOdd
                    return (
                      <Link
                        key={park.id}
                        href={`/park/${park.id}`}
                        className={`relative overflow-hidden rounded-xl group ${fullWidth ? 'col-span-2' : ''}`}
                        style={{ height: fullWidth ? '220px' : '180px' }}
                      >
                        {park.cover_photo_url ? (
                          <img src={park.cover_photo_url} alt={park.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-green-100 flex items-center justify-center text-5xl">🌳</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white font-semibold text-sm leading-tight drop-shadow">{park.name}</p>
                          {park.reflection && (
                            <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{park.reflection}</p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Search / find more parks */}
            <button
              onClick={() => setShowSearch(s => !s)}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-green-300 rounded-2xl py-4 text-green-600 font-medium hover:border-green-400 hover:bg-green-50 transition-all mb-4"
            >
              <span className="text-xl">+</span>
              {showSearch ? 'Hide parks' : 'Find a park to visit'}
            </button>

            {showSearch && (
              <div>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search parks or neighborhoods..."
                  autoFocus
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 mb-3"
                />
                <div className="space-y-2">
                  {searchResults.map(park => (
                    <Link key={park.id} href={`/park/${park.id}`} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:bg-green-50 transition-all group">
                      <div>
                        <p className="font-medium text-gray-700">{park.name}</p>
                        {park.neighborhood && <p className="text-xs text-gray-400">{park.neighborhood}</p>}
                      </div>
                      <span className="text-green-300 group-hover:text-green-500 transition-colors">→</span>
                    </Link>
                  ))}
                  {searchResults.length === 0 && search && (
                    <p className="text-center text-gray-400 text-sm py-6">No parks found for "{search}"</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
