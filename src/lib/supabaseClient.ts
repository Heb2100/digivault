import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

export const createSupabaseClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('createSupabaseClient must be called in client-side only')
  }

  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) throw new Error('Supabase env not loaded!')

    supabase = createClient(url, key)
  }

  return supabase
}
