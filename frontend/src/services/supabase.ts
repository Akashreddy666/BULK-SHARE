import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

let supabaseInstance: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'your-supabase-anon-key'
  && !['https://your-project.supabase.co', 'https://your-project-ref.supabase.co'].includes(supabaseUrl)) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err)
  }
}

export const supabase = supabaseInstance
export const isSupabaseConfigured = Boolean(supabaseInstance)
