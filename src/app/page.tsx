'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Park } from '@/lib/supabase'

export default function Home() {
  const [parks, setParks] = useState<Park[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'visited' | 'unvisited'>('all')

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

  const visited = parks.filter(p => p.visited).length
  const total = parks.length
  const pct = total > 0 ? Math.round((visited / total) * 100) : 0

  const filtered = parks.filter(p => {
    if (filter === 'visited') return p.visited
    if (filter === 'unvisited') return !p.visited
    return true
  })

  const byNeighborhood = filtered.reduce<Record<string, Park[]>>((acc, park) => {
    const key = park.neighborhood ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(park)
    return acc
  }, {})

  return (
    <main className="min-h-screen bg-green-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-green-900 mb-1">🌳 Love the Park</h1>
          <p className="text-green-700 text-sm">Boston parks — summer 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-green-900 font-semibold text-lg">{visited} of {total} parks visited</span>
            <span className="text-green-600 font-bold text-xl">{pct}%</span>
          </div>
          <div className="w-full bg-green-100 rounded-full h-4 overflow-hidden">
            <div
              className="bg-green-500 h-4 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct === 100 && (
            <p className="text-center mt-3 text-green-700 font-semibold">You visited every park! 🎉</p>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'visited', 'unvisited'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-green-700 hover:bg-green-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-green-600">Loading parks...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(byNeighborhood).sort().map(([neighborhood, nParks]) => (
              <div key={neighborhood}>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-green-500 mb-2 px-1">
                  {neighborhood}
                </h2>
                <div className="space-y-2">
                  {nParks.map(park => (
                    <Link
                      key={park.id}
                      href={`/park/${park.id}`}
                      className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:bg-green-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {park.visited ? '✅' : '⬜'}
                        </span>
                        <span className={`font-medium ${park.visited ? 'text-green-800' : 'text-gray-700'}`}>
                          {park.name}
                        </span>
                        {park.reflection && (
                          <span className="text-xs text-green-400">📝</span>
                        )}
                      </div>
                      <span className="text-green-300 group-hover:text-green-500 transition-colors">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
