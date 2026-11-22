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
  ConfirmationRound,
  MemberConfirmation,
  GroupOrder,
  AuditLog,
  FulfillmentPreference,
  MemberConfirmationStatus,
  HouseholdInvoice,
  PaymentTransaction,
  GroupOrderPaymentSummary,
  ProcurementOrder,
  MemberFulfillment,
  Notification,
  OrderDispute,
  DisputeCategory,
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
        if (typeof errorJson.detail === 'string') {
          detail = errorJson.detail
        } else if (Array.isArray(errorJson.detail)) {
          const messages = errorJson.detail.flatMap((entry: unknown) => {
            if (typeof entry !== 'object' || entry === null || !('msg' in entry)) return []
            return typeof entry.msg === 'string' ? [entry.msg] : []
          })
          if (messages.length) detail = messages.join('. ')
        }
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
    throw new ApiError('Could not connect to BULK SHARE. Check your connection and try again.', 0)
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
  getSuppliers: () => request<SupplierProfile[]>('/suppliers'),
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

  // Milestone 4: Confirmations & Order Locking
  selectQuotation: (
    groupId: string,
    data: { quotation_id: string; deadline_hours?: number; notes?: string }
  ) =>
    request<ConfirmationRound>(`/groups/${groupId}/select-quotation`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getConfirmationRound: (groupId: string) =>
    request<ConfirmationRound | null>(`/groups/${groupId}/confirmation-round`),
  confirmMemberAllocation: (
    groupId: string,
    data: {
      status: MemberConfirmationStatus
      fulfillment_preference?: FulfillmentPreference
      delivery_address?: string
      rejection_reason?: string
    }
  ) =>
    request<MemberConfirmation>(`/groups/${groupId}/confirmation-round/confirm`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recalculateOrder: (groupId: string) =>
    request<ConfirmationRound>(`/groups/${groupId}/recalculate`, {
      method: 'POST',
    }),
  lockGroupOrder: (groupId: string) =>
    request<GroupOrder>(`/groups/${groupId}/lock-order`, {
      method: 'POST',
    }),
  getGroupOrder: (groupId: string) =>
    request<GroupOrder | null>(`/groups/${groupId}/order`),
  getGroupAuditLogs: (groupId: string) =>
    request<AuditLog[]>(`/audit/groups/${groupId}`),

  // Milestone 5: Simulated Payments
  getHouseholdInvoice: (groupOrderId: string) =>
    request<HouseholdInvoice>(`/orders/${groupOrderId}/invoice`),
  simulatePayment: (
    groupOrderId: string,
    data: { payment_method: string; notes?: string }
  ) =>
    request<PaymentTransaction>(`/orders/${groupOrderId}/payments/simulate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPaymentSummary: (groupOrderId: string) =>
    request<GroupOrderPaymentSummary>(`/orders/${groupOrderId}/payments/summary`),

  // Milestone 5: Wholesale Procurement
  adminPlaceProcurementOrder: (
    groupOrderId: string,
    data: { estimated_delivery_date?: string; notes?: string }
  ) =>
    request<ProcurementOrder>(`/orders/${groupOrderId}/procurement/place`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getOrderProcurement: (groupOrderId: string) =>
    request<ProcurementOrder | null>(`/orders/${groupOrderId}/procurement`),
  updateProcurementStatus: (
    procurementId: string,
    data: { status: string; notes?: string }
  ) =>
    request<ProcurementOrder>(`/procurement/${procurementId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getSupplierProcurementOrders: () =>
    request<ProcurementOrder[]>('/supplier/procurement-orders'),

  // Milestone 5: Hub Pickup & Fulfillment
  getOrderFulfillments: (groupOrderId: string) =>
    request<MemberFulfillment[]>(`/orders/${groupOrderId}/fulfillments`),
  verifyPickupCode: (groupOrderId: string, pickupCode: string) =>
    request<MemberFulfillment>(`/orders/${groupOrderId}/fulfillments/verify-pickup`, {
      method: 'POST',
      body: JSON.stringify({ pickup_code: pickupCode }),
    }),
  updateDeliveryStatus: (
    groupOrderId: string,
    fulfillmentId: string,
    data: { status: string; notes?: string }
  ) =>
    request<MemberFulfillment>(
      `/orders/${groupOrderId}/fulfillments/${fulfillmentId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),

  // Milestone 5: Notifications
  getNotifications: () => request<Notification[]>('/notifications'),
  markNotificationRead: (notificationId: string) =>
    request<Notification>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsRead: () =>
    request<{ message: string }>('/notifications/mark-all-read', {
      method: 'POST',
    }),

  // Milestone 5: Disputes
  createDispute: (
    groupOrderId: string,
    data: { category: DisputeCategory; description: string }
  ) =>
    request<OrderDispute>(`/orders/${groupOrderId}/disputes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getOrderDisputes: (groupOrderId: string) =>
    request<OrderDispute[]>(`/orders/${groupOrderId}/disputes`),
  getAdminDisputes: (status?: string) => {
    const url = status ? `/admin/disputes?status=${status}` : '/admin/disputes'
    return request<OrderDispute[]>(url)
  },
  resolveDispute: (
    disputeId: string,
    data: { status: string; resolution_notes: string; refund_amount?: number }
  ) =>
    request<OrderDispute>(`/admin/disputes/${disputeId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}
