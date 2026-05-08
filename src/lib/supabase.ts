import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Supabase env vars missing. Check .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// ─── Типы из БД ───
export type UserRole = 'customer' | 'master' | 'supplier'

export interface Profile {
  id: string
  role: UserRole
  name: string
  phone?: string
  city: string
  avatar_url?: string
  bio?: string
  verified: boolean
  created_at: string
}
