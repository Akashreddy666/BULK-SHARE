import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseInstance: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co') {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err)
  }
}

export const supabase = supabaseInstance
export const isSupabaseConfigured = Boolean(supabaseInstance)
