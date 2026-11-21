import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PaymentModal } from '@/components/payment/PaymentModal'
import { PickupPassCard } from '@/components/fulfillment/PickupPassCard'
import { HubPickupDesk } from '@/components/fulfillment/HubPickupDesk'
import { DisputeModal } from '@/components/dispute/DisputeModal'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { api } from '@/services/api'
import { HouseholdInvoice, MemberFulfillment, Notification } from '@/types'

// Mock api service
vi.mock('@/services/api', () => ({
  api: {
    getHouseholdInvoice: vi.fn(),
    simulatePayment: vi.fn(),
    getOrderFulfillments: vi.fn(),
    verifyPickupCode: vi.fn(),
    updateDeliveryStatus: vi.fn(),
    createDispute: vi.fn(),
    getNotifications: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  },
}))

describe('Milestone 5 Frontend Components', () => {
  const mockInvoice: HouseholdInvoice = {
    group_order_id: 'order-m5-01',
    group_name: 'Palm Meadows Bulk Club',
    user_id: 'cust-01',
    user_name: 'Priya Sharma',
    user_email: 'priya@example.com',
    items: [
      {
        product_name: 'Sona Masoori Rice',
        variant_brand: 'India Gate Premium',
        package_size: 5,
        unit: 'kg',
        quantity: 2,
        retail_rate: 450,
        wholesale_rate: 360,
        retail_total: 900,
        wholesale_total: 720,
        savings: 180,
      },
    ],
    subtotal_retail: 900,
    subtotal_wholesale: 720,
    total_savings: 180,
    fulfillment_type: 'PICKUP',
    delivery_surcharge: 0,
    final_payable: 720,
    payment_status: 'PENDING',
  }

  const mockFulfillment: MemberFulfillment = {
    id: 'ful-01',
    group_order_id: 'order-m5-01',
    user_id: 'cust-01',
    user_name: 'Priya Sharma',
    fulfillment_type: 'PICKUP',
    pickup_code: 'BS-4912',
    delivery_address: null,
    status: 'READY_FOR_PICKUP',
    created_at: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders PaymentModal with itemized grocery breakdown, savings, and processes payment', async () => {
    vi.mocked(api.getHouseholdInvoice).mockResolvedValue(mockInvoice)
    vi.mocked(api.simulatePayment).mockResolvedValue({
      id: 'pay-01',
      group_order_id: 'order-m5-01',
      user_id: 'cust-01',
      amount: 720,
      currency: 'INR',
      payment_method: 'UPI',
      transaction_ref: 'TXN-BS-2026-9999',
      receipt_number: 'RCP-BS-2026-9999',
      status: 'COMPLETED',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })

    const handleSuccess = vi.fn()
    render(
      <PaymentModal
        isOpen={true}
        onClose={vi.fn()}
        groupOrderId="order-m5-01"
        onPaymentSuccess={handleSuccess}
      />
    )

    // Wait for invoice items to display
    await waitFor(() => {
      expect(screen.getByText('Sona Masoori Rice')).toBeInTheDocument()
    })

    expect(screen.getByText(/Total Payable: ₹720.00/i)).toBeInTheDocument()
    expect(screen.getByText(/You Save ₹180.00/i)).toBeInTheDocument()
    expect(screen.getByText('UPI Instant')).toBeInTheDocument()

    // Click pay
    const payBtn = screen.getByRole('button', { name: /Pay ₹720.00/i })
    fireEvent.click(payBtn)

    await waitFor(() => {
      expect(screen.getByText(/Payment Settled Successfully!/i)).toBeInTheDocument()
      expect(screen.getByText(/RCP-BS-2026-9999/i)).toBeInTheDocument()
    })
    expect(handleSuccess).toHaveBeenCalled()
  })

  it('renders PickupPassCard with digital customer verification PIN and hub location', () => {
    render(
      <PickupPassCard
        fulfillment={mockFulfillment}
        groupOrderId="order-m5-01"
        invoice={mockInvoice}
      />
    )

    expect(screen.getByText('BS-4912')).toBeInTheDocument()
    expect(screen.getByText(/Ready for Hub Pickup/i)).toBeInTheDocument()
    expect(screen.getByText(/Hub Location: Indiranagar Community Hall/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pay My Share/i })).toBeInTheDocument()
  })

  it('renders HubPickupDesk and verifies customer pickup code', async () => {
    vi.mocked(api.getOrderFulfillments).mockResolvedValue([mockFulfillment])
    vi.mocked(api.verifyPickupCode).mockResolvedValue({
      ...mockFulfillment,
      status: 'PICKED_UP',
      completed_at: new Date().toISOString(),
    })

    render(<HubPickupDesk groupOrderId="order-m5-01" groupName="Palm Meadows Bulk Club" />)

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/e.g. BS-4829/i)
    fireEvent.change(input, { target: { value: 'BS-4912' } })

    const verifyBtn = screen.getByRole('button', { name: /Verify & Handover/i })
    fireEvent.click(verifyBtn)

    await waitFor(() => {
      expect(api.verifyPickupCode).toHaveBeenCalledWith('order-m5-01', 'BS-4912')
    })
  })

  it('renders DisputeModal and submits customer ticket', async () => {
    vi.mocked(api.createDispute).mockResolvedValue({
      id: 'disp-01',
      group_order_id: 'order-m5-01',
      user_id: 'cust-01',
      category: 'DAMAGED_PACKS',
      description: 'Rice bag had a torn outer plastic seal.',
      status: 'OPEN',
      refund_amount: 0,
      created_at: new Date().toISOString(),
    })

    const handleSubmitted = vi.fn()
    render(
      <DisputeModal
        isOpen={true}
        onClose={vi.fn()}
        groupOrderId="order-m5-01"
        onDisputeSubmitted={handleSubmitted}
      />
    )

    expect(screen.getByText(/Report an Issue or Dispute/i)).toBeInTheDocument()
    expect(screen.getByText(/Damaged Packaging \/ Torn Seal/i)).toBeInTheDocument()

    const textarea = screen.getByPlaceholderText(/Describe what went wrong/i)
    fireEvent.change(textarea, { target: { value: 'Rice bag had a torn outer plastic seal.' } })

    const submitBtn = screen.getByRole('button', { name: /Submit Ticket/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.createDispute).toHaveBeenCalledWith('order-m5-01', {
        category: 'DAMAGED_PACKS',
        description: 'Rice bag had a torn outer plastic seal.',
      })
      expect(screen.getByText(/Dispute Ticket Logged/i)).toBeInTheDocument()
    })
  })

  it('renders NotificationBell and displays unread alerts dropdown', async () => {
    const mockNotifs: Notification[] = [
      {
        id: 'notif-1',
        user_id: 'cust-01',
        title: 'Wholesale Goods Dispatched',
        message: 'Your bulk order is on the way to the hub.',
        type: 'PO_DISPATCHED',
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ]
    vi.mocked(api.getNotifications).mockResolvedValue(mockNotifs)

    render(<NotificationBell />)

    const bellBtn = screen.getByRole('button', { name: /View notifications/i })
    fireEvent.click(bellBtn)

    await waitFor(() => {
      expect(screen.getByText('Wholesale Goods Dispatched')).toBeInTheDocument()
      expect(screen.getByText(/Your bulk order is on the way to the hub/i)).toBeInTheDocument()
    })
  })
})
