import {
  HealthResponse,
  Neighborhood,
  User,
  BuyingGroup,
  CreateGroupInput,
  GroupInvitation,
  Product,
  ProductCategory,
  HouseholdGroceryList,
  GroceryListItem,
  BrandPreference,
  DemandSummaryResponse,
  DemandSnapshot,
  HouseholdSavingsResponse,
  SupplierProfile,
  SupplierProductOffer,
  SupplierQuotation,
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('bulkshare_token')
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('bulkshare_token', token)
  } else {
    localStorage.removeItem('bulkshare_token')
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const url = `${API_BASE_URL}${endpoint}`

  try {
    const res = await fetch(url, { ...options, headers })
    if (!res.ok) {
      let detail = `Request failed with status ${res.status}`
      try {
        const errorJson = await res.json()
        detail = errorJson.detail || detail
      } catch {
        // Fallback to text
      }
      throw new ApiError(detail, res.status)
    }
    if (res.status === 204) {
      return {} as T
    }
    return (await res.json()) as T
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err
    const message = err instanceof Error ? err.message : 'Network error connecting to BULK SHARE API'
    throw new ApiError(message, 500)
  }
}

export const api = {
  // Auth & System
  getHealth: () => request<HealthResponse>('/health'),
  getNeighborhoods: () => request<Neighborhood[]>('/neighborhoods'),
  getMe: () => request<User>('/users/me'),
  updateMe: (data: Partial<Pick<User, 'full_name' | 'phone' | 'neighborhood_id'>>) =>
    request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  demoLogin: (role: string, email?: string) =>
    request<{ access_token: string; user: User; demo_mode: boolean }>('/users/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role, email }),
    }),

  // Groups
  getGroups: (params?: {
    neighborhood_id?: string
    my_groups_only?: boolean
    visibility?: string
    status?: string
  }) => {
    const query = new URLSearchParams()
    if (params?.neighborhood_id) query.set('neighborhood_id', params.neighborhood_id)
    if (params?.my_groups_only !== undefined) query.set('my_groups_only', String(params.my_groups_only))
    if (params?.visibility) query.set('visibility', params.visibility)
    if (params?.status) query.set('status', params.status)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return request<BuyingGroup[]>(`/groups${qs}`)
  },
  getGroup: (id: string) => request<BuyingGroup>(`/groups/${id}`),
  createGroup: (data: CreateGroupInput) =>
    request<BuyingGroup>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateGroup: (id: string, data: Partial<CreateGroupInput>) =>
    request<BuyingGroup>(`/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  joinGroup: (id: string) =>
    request<BuyingGroup>(`/groups/${id}/join`, {
      method: 'POST',
    }),
  leaveGroup: (id: string) =>
    request<BuyingGroup>(`/groups/${id}/leave`, {
      method: 'POST',
    }),
  createGroupInvitation: (groupId: string, data: { expires_in_days?: number; max_uses?: number }) =>
    request<GroupInvitation>(`/groups/${groupId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  redeemInvitation: (token: string) =>
    request<BuyingGroup>('/groups/invitations/redeem', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  // Catalog
  getProducts: (category?: ProductCategory | string) => {
    const qs = category ? `?category=${category}` : ''
    return request<Product[]>(`/products${qs}`)
  },
  getProductVariants: (productId: string) =>
    request<Product['variants']>(`/products/${productId}/variants`),

  // Household Grocery Lists
  getMyGroceryItems: (groupId: string) =>
    request<HouseholdGroceryList>(`/groups/${groupId}/my-items`),
  addGroceryItem: (
    groupId: string,
    data: { variant_id: string; pack_quantity: number; brand_preference: BrandPreference }
  ) =>
    request<GroceryListItem>(`/groups/${groupId}/my-items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateGroceryItem: (
    groupId: string,
    itemId: string,
    data: { pack_quantity?: number; brand_preference?: BrandPreference }
  ) =>
    request<GroceryListItem>(`/groups/${groupId}/my-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteGroceryItem: (groupId: string, itemId: string) =>
    request<{ success: boolean }>(`/groups/${groupId}/my-items/${itemId}`, {
      method: 'DELETE',
    }),

  // Milestone 3: Demand Aggregation & Snapshots
  getDemandSummary: (groupId: string) =>
    request<DemandSummaryResponse>(`/groups/${groupId}/demand-summary`),
  triggerDemandSnapshot: (groupId: string) =>
    request<DemandSnapshot>(`/groups/${groupId}/demand-snapshot`, {
      method: 'POST',
    }),
  getDemandSnapshots: (groupId: string) =>
    request<DemandSnapshot[]>(`/groups/${groupId}/demand-snapshots`),
  getMySavings: (groupId: string) =>
    request<HouseholdSavingsResponse>(`/groups/${groupId}/savings`),

  // Milestone 3: Supplier Profiles & Product Offers
  getMySupplierProfile: () =>
    request<SupplierProfile>('/suppliers/me/profile'),
  createSupplierProfile: (data: Partial<SupplierProfile>) =>
    request<SupplierProfile>('/suppliers/me/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSupplierProfile: (data: Partial<SupplierProfile>) =>
    request<SupplierProfile>('/suppliers/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getMySupplierOffers: () =>
    request<SupplierProductOffer[]>('/suppliers/me/offers'),
  createSupplierOffer: (data: {
    variant_id: string
    offer_price_per_pack: number
    min_order_packs?: number
    max_order_packs?: number | null
  }) =>
    request<SupplierProductOffer>('/suppliers/me/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSupplierOffer: (
    offerId: string,
    data: Partial<Pick<SupplierProductOffer, 'offer_price_per_pack' | 'min_order_packs' | 'max_order_packs' | 'is_active'>>
  ) =>
    request<SupplierProductOffer>(`/suppliers/me/offers/${offerId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteSupplierOffer: (offerId: string) =>
    request<{ success: boolean }>(`/suppliers/me/offers/${offerId}`, {
      method: 'DELETE',
    }),

  // Milestone 3: Quotations
  getGroupQuotations: (groupId: string) =>
    request<SupplierQuotation[]>(`/groups/${groupId}/quotations`),
  submitQuotation: (data: {
    demand_snapshot_id: string
    valid_until: string
    notes?: string
    items: Array<{ variant_id: string; quoted_price_per_pack: number }>
  }) =>
    request<SupplierQuotation>('/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getQuotationDetail: (quotationId: string) =>
    request<SupplierQuotation>(`/quotations/${quotationId}`),
  getSnapshotDetail: (snapshotId: string) =>
    request<DemandSnapshot>(`/quotations/snapshots/${snapshotId}`),
}
