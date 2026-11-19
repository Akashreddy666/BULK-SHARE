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

// --- Milestone 2: Buying Groups, Catalog, and Grocery Lists ---

export type GroupVisibility = 'PUBLIC' | 'PRIVATE'

export type GroupStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'QUOTING'
  | 'CONFIRMING'
  | 'LOCKED'
  | 'PROCUREMENT'
  | 'FULFILLMENT'
  | 'COMPLETED'
  | 'CANCELLED'

export interface GroupMember {
  id: string
  user_id: string
  is_organizer: boolean
  joined_at: string
  user?: User | null
}

export interface BuyingGroup {
  id: string
  name: string
  description?: string | null
  neighborhood_id: string
  organizer_id: string
  visibility: GroupVisibility
  status: GroupStatus
  deadline: string
  close_rule: string
  min_members: number
  max_members?: number | null
  version: number
  created_at: string
  updated_at: string
  neighborhood?: Neighborhood | null
  organizer?: User | null
  members_count: number
  is_member: boolean
  is_organizer: boolean
}

export interface CreateGroupInput {
  name: string
  description?: string
  neighborhood_id: string
  visibility: GroupVisibility
  deadline: string
  close_rule?: string
  min_members?: number
  max_members?: number | null
}

export interface GroupInvitation {
  id: string
  group_id: string
  token: string
  expires_at: string
  max_uses: number
  uses_count: number
  is_valid: boolean
  created_at: string
}

export type ProductCategory = 'RICE' | 'OIL' | 'DAL' | 'SUGAR' | 'FLOUR'

export interface ProductVariant {
  id: string
  product_id: string
  brand: string
  pack_quantity: number
  pack_unit: string
  sku: string
  reference_retail_price: number
  is_active: boolean
  created_at?: string
}

export interface Product {
  id: string
  name: string
  category: ProductCategory
  base_unit: string
  description?: string | null
  is_active: boolean
  variants: ProductVariant[]
}

export type BrandPreference = 'EXACT' | 'FLEXIBLE'

export interface GroceryListItem {
  id: string
  group_id: string
  user_id: string
  variant_id: string
  pack_quantity: number
  brand_preference: BrandPreference
  created_at: string
  updated_at: string
  variant?: ProductVariant | null
  estimated_item_retail_total?: number
}

export interface HouseholdGroceryList {
  group_id: string
  items: GroceryListItem[]
  total_packs: number
  total_reference_retail_price: number
}
