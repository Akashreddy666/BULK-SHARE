export type UserRole = 'CUSTOMER' | 'SUPPLIER' | 'ADMIN'

export interface Neighborhood {
  id: string
  name: string
  city: string
  postal_code: string
  is_active: boolean
}

export interface User {
  id: string
  supabase_uid: string
  email: string
  full_name: string
  phone?: string | null
  role: UserRole
  is_active: boolean
  neighborhood_id?: string | null
  neighborhood?: Neighborhood | null
  created_at: string
  updated_at: string
}

export interface HealthResponse {
  status: string
  project: string
  environment: string
  version: string
  demo_mode: boolean
  timestamp: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  demoMode: boolean
}
