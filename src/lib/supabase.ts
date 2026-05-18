import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Park = {
  id: string
  name: string
  neighborhood: string | null
  visited: boolean
  visited_at: string | null
  reflection: string | null
  cover_photo_url: string | null
  created_at: string
}

export type ParkPhoto = {
  name: string
  url: string
}

export type Reflection = {
  id: string
  park_id: string
  text: string
  created_at: string
}
