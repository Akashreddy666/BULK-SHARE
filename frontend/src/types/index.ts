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

// --- Milestone 3: Wholesale Tiers, Demand Aggregation, Quotations & Savings ---

export interface WholesalePriceTier {
  id: string
  variant_id: string
  min_quantity: number
  price_per_pack: number
  tier_label: string
  is_active: boolean
  created_at: string
}

export interface SupplierProfile {
  id: string
  user_id: string
  company_name: string
  gstin?: string | null
  address?: string | null
  city: string
  phone?: string | null
  is_verified: boolean
  description?: string | null
  created_at: string
  updated_at: string
}

export interface SupplierProductOffer {
  id: string
  supplier_id: string
  variant_id: string
  offer_price_per_pack: number
  min_order_packs: number
  max_order_packs?: number | null
  is_active: boolean
  variant_display_name?: string | null
  created_at: string
  updated_at: string
}

export interface DemandLineItem {
  variant_id: string
  product_name: string
  category: string
  brand: string
  pack_quantity: number
  pack_unit: string
  variant_display_name: string
  reference_retail_price: number
  total_packs: number
  total_quantity_units: number
  total_retail_value: number
  qualified_tier?: WholesalePriceTier | null
  next_tier?: WholesalePriceTier | null
  packs_to_next_tier?: number | null
  best_wholesale_price?: number | null
  estimated_wholesale_cost?: number | null
  estimated_savings?: number | null
  savings_percentage?: number | null
}

export interface DemandSummaryResponse {
  group_id: string
  group_name: string
  snapshot_version?: number | null
  total_variants: number
  total_packs: number
  total_retail_value: number
  estimated_wholesale_value: number
  estimated_savings: number
  savings_percentage: number
  items: DemandLineItem[]
}

export interface DemandSnapshot {
  id: string
  group_id: string
  snapshot_version: number
  snapshot_data: string
  total_retail_value: number
  total_packs: number
  created_at: string
}

export interface QuotationItem {
  id: string
  quotation_id: string
  variant_id: string
  quoted_packs: number
  quoted_price_per_pack: number
  line_total: number
  variant_display_name?: string | null
  reference_retail_price?: number | null
}

export interface SupplierQuotation {
  id: string
  demand_snapshot_id: string
  supplier_id: string
  supplier_name?: string | null
  status: 'SUBMITTED' | 'EXPIRED' | 'ACCEPTED' | 'REJECTED'
  total_quoted_price: number
  total_retail_value?: number | null
  savings_amount?: number | null
  savings_percentage?: number | null
  valid_until: string
  notes?: string | null
  items: QuotationItem[]
  created_at: string
  updated_at: string
}

export interface HouseholdSavingsItem {
  variant_id: string
  variant_display_name: string
  brand_preference: string
  pack_quantity: number
  reference_retail_price: number
  retail_total: number
  wholesale_price_per_pack?: number | null
  wholesale_total?: number | null
  savings_amount?: number | null
  savings_percentage?: number | null
}

export interface HouseholdSavingsResponse {
  group_id: string
  user_id: string
  total_packs: number
  total_retail_cost: number
  total_wholesale_cost: number
  total_savings: number
  savings_percentage: number
  items: HouseholdSavingsItem[]
}


// --- Milestone 4: Confirmation Rounds, Member Confirmations & Locked Orders ---

export type RoundStatus = 'OPEN' | 'COMPLETED' | 'FAILED' | 'RECALCULATED'
export type MemberConfirmationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'
export type FulfillmentPreference = 'PICKUP' | 'HOME_DELIVERY'
export type OrderLockStatus = 'LOCKED' | 'PROCUREMENT_PENDING' | 'PROCURED' | 'FULFILLED' | 'CANCELLED'

export interface MemberConfirmation {
  id: string
  confirmation_round_id: string
  group_id: string
  user_id: string
  user_name?: string | null
  status: MemberConfirmationStatus
  rejection_reason?: string | null
  total_household_cost: number
  total_household_savings: number
  confirmed_at?: string | null
  fulfillment_preference: FulfillmentPreference
  delivery_address?: string | null
  created_at: string
}

export interface ConfirmationRound {
  id: string
  group_id: string
  selected_quotation_id: string
  round_number: number
  status: RoundStatus
  deadline: string
  notes?: string | null
  total_members: number
  confirmed_count: number
  rejected_count: number
  pending_count: number
  confirmations: MemberConfirmation[]
  selected_quotation?: SupplierQuotation | null
  created_at: string
}

export interface GroupOrder {
  id: string
  group_id: string
  selected_quotation_id: string
  confirmation_round_id: string
  status: OrderLockStatus
  total_retail_amount: number
  total_wholesale_amount: number
  total_savings_amount: number
  total_packs: number
  locked_at: string
  locked_by_user_id: string
  order_allocations_data: string
  created_at: string
  supplier_name?: string | null
}

export interface AuditLog {
  id: string
  entity_type: string
  entity_id: string
  action: string
  actor_user_id?: string | null
  actor_role?: string | null
  details?: string | null
  created_at: string
}
