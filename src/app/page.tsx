'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Park } from '@/lib/supabase'

export default function Home() {
  const [parks, setParks] = useState<Park[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    supabase
      .from('parks')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data) setParks(data)
        setLoading(false)
      })
  }, [])

  const visitedParks = parks.filter(p => p.visited)
  const unvisitedParks = parks.filter(p => !p.visited)
  const visited = visitedParks.length
  const total = parks.length
  const pct = total > 0 ? Math.round((visited / total) * 100) : 0

  const searchResults = unvisitedParks.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.neighborhood ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-green-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-black text-green-900 tracking-tight">PARK! 2026</h1>
          <p className="text-green-600 text-sm mt-1">Boston · Cambridge · Somerville</p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl shadow-sm px-6 py-4 mb-8">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-green-900 font-semibold">{visited} of {total} visited</span>
            <span className="text-green-600 font-bold">{pct}%</span>
          </div>
          <div className="w-full bg-green-100 rounded-full h-3 overflow-hidden">
            <div className="bg-green-500 h-3 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Visited parks bubbles */}
        {loading ? (
          <div className="text-center py-20 text-green-500">Loading...</div>
        ) : visitedParks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-3">🌳</p>
            <p className="font-medium">No parks visited yet!</p>
            <p className="text-sm mt-1">Search below to find your first park.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {visitedParks.map(park => (
              <Link key={park.id} href={`/park/${park.id}`} className="flex flex-col items-center gap-2 group">
                <div className="w-24 h-24 rounded-full overflow-hidden shadow-md ring-2 ring-green-200 group-hover:ring-green-400 transition-all bg-green-100 shrink-0">
                  {park.cover_photo_url ? (
                    <img src={park.cover_photo_url} alt={park.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🌳</div>
                  )}
                </div>
                <span className="text-xs text-center text-green-800 font-medium leading-tight line-clamp-2">{park.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Search section */}
        <div>
          <button
            onClick={() => setShowSearch(s => !s)}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-green-300 rounded-2xl py-4 text-green-600 font-medium hover:border-green-400 hover:bg-green-50 transition-all"
          >
            <span className="text-xl">+</span>
            {showSearch ? 'Hide parks' : 'Find a park to visit'}
          </button>

          {showSearch && (
            <div className="mt-4">
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
                  <Link
                    key={park.id}
                    href={`/park/${park.id}`}
                    className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:bg-green-50 transition-all group"
                  >
                    <div>
                      <p className="font-medium text-gray-700">{park.name}</p>
                      {park.neighborhood && (
                        <p className="text-xs text-gray-400">{park.neighborhood}</p>
                      )}
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
        </div>

      </div>
    </main>
  )
}
